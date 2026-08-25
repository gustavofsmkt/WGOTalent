import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  connectMock,
  getMailboxLockMock,
  searchMock,
  fetchMock,
  logoutMock,
  releaseMock,
  simpleParserMock,
  mailboxRef,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  getMailboxLockMock: vi.fn(),
  searchMock: vi.fn(),
  fetchMock: vi.fn(),
  logoutMock: vi.fn(),
  releaseMock: vi.fn(),
  simpleParserMock: vi.fn(),
  mailboxRef: { current: { uidNext: 100 } as { uidNext: number } | false },
}));

vi.mock("imapflow", () => ({
  ImapFlow: class {
    connect = connectMock;
    getMailboxLock = getMailboxLockMock;
    search = searchMock;
    fetch = fetchMock;
    logout = logoutMock;
    get mailbox() {
      return mailboxRef.current;
    }
  },
}));

vi.mock("mailparser", () => ({
  simpleParser: simpleParserMock,
}));

import { buscarMensagensNovas } from "./imap-client";

function asyncIterable<T>(items: T[]) {
  return (async function* () {
    for (const item of items) yield item;
  })();
}

describe("buscarMensagensNovas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectMock.mockResolvedValue(undefined);
    getMailboxLockMock.mockResolvedValue({ path: "INBOX", release: releaseMock });
    logoutMock.mockResolvedValue(undefined);
    mailboxRef.current = { uidNext: 100 };
  });

  const params = {
    host: "imap.gmail.com",
    porta: 993,
    usuario: "rh@empresa.com",
    senha: "senha",
    pasta: "INBOX",
    desdeUid: 10,
  };

  it("searches by UID range starting right after the watermark", async () => {
    searchMock.mockResolvedValueOnce([]);

    await buscarMensagensNovas(params);

    expect(searchMock).toHaveBeenCalledWith({ uid: "11:*" }, { uid: true });
  });

  it("includes since in the search criteria when capturarDesde is set", async () => {
    searchMock.mockResolvedValueOnce([]);

    await buscarMensagensNovas({ ...params, capturarDesde: "2026-05-24" });

    expect(searchMock).toHaveBeenCalledWith(
      { uid: "11:*", since: "2026-05-24" },
      { uid: true },
    );
  });

  it("omits since from the search criteria when capturarDesde is not set", async () => {
    searchMock.mockResolvedValueOnce([]);

    await buscarMensagensNovas(params);

    const [criteria] = searchMock.mock.calls[0]!;
    expect(criteria).not.toHaveProperty("since");
  });

  it("starts from the mailbox's current uidNext when never captured before — skips history instead of scanning it", async () => {
    mailboxRef.current = { uidNext: 5000 };
    searchMock.mockResolvedValueOnce([]);

    const result = await buscarMensagensNovas({ ...params, desdeUid: null });

    expect(searchMock).toHaveBeenCalledWith({ uid: "5000:*" }, { uid: true });
    expect(result.uidReferencia).toBe(4999);
  });

  it("returns uidReferencia even with zero messages, so the watermark can advance without any new mail", async () => {
    mailboxRef.current = { uidNext: 42 };
    searchMock.mockResolvedValueOnce(false);

    const result = await buscarMensagensNovas(params);

    expect(result).toEqual({ mensagens: [], uidReferencia: 41 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps only attachments with an allowed mimetype and under the size limit", async () => {
    searchMock.mockResolvedValueOnce([11, 12]);
    fetchMock.mockReturnValueOnce(
      asyncIterable([{ uid: 11, source: Buffer.from("raw email") }]),
    );
    simpleParserMock.mockResolvedValueOnce({
      attachments: [
        { filename: "cv.pdf", contentType: "application/pdf", content: Buffer.alloc(1024) },
        { filename: "cv.exe", contentType: "application/x-msdownload", content: Buffer.alloc(1024) },
        {
          filename: "cv-grande.pdf",
          contentType: "application/pdf",
          content: Buffer.alloc(6 * 1024 * 1024),
        },
      ],
    });

    const result = await buscarMensagensNovas(params);

    expect(result.mensagens).toEqual([
      {
        uid: 11,
        anexos: [{ filename: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(1024) }],
      },
    ]);
  });

  it("skips messages without a fetched source", async () => {
    searchMock.mockResolvedValueOnce([11]);
    fetchMock.mockReturnValueOnce(asyncIterable([{ uid: 11, source: undefined }]));

    const result = await buscarMensagensNovas(params);

    expect(result.mensagens).toEqual([]);
    expect(simpleParserMock).not.toHaveBeenCalled();
  });

  it("caps the batch at limiteLote, sorted ascending, and reports uidReferencia as null (more remain)", async () => {
    searchMock.mockResolvedValueOnce([15, 11, 13]);
    fetchMock.mockReturnValueOnce(
      asyncIterable([
        { uid: 11, source: Buffer.from("a") },
        { uid: 13, source: Buffer.from("b") },
      ]),
    );
    simpleParserMock.mockResolvedValue({ attachments: [] });

    const result = await buscarMensagensNovas({ ...params, limiteLote: 2 });

    expect(fetchMock).toHaveBeenCalledWith([11, 13], expect.anything(), expect.anything());
    expect(result.mensagens.map((m) => m.uid)).toEqual([11, 13]);
    expect(result.uidReferencia).toBeNull();
  });

  it("returns the normal uidReferencia when everything found fits within limiteLote", async () => {
    mailboxRef.current = { uidNext: 20 };
    searchMock.mockResolvedValueOnce([11, 12]);
    fetchMock.mockReturnValueOnce(
      asyncIterable([
        { uid: 11, source: Buffer.from("a") },
        { uid: 12, source: Buffer.from("b") },
      ]),
    );
    simpleParserMock.mockResolvedValue({ attachments: [] });

    const result = await buscarMensagensNovas({ ...params, limiteLote: 5 });

    expect(fetchMock).toHaveBeenCalledWith([11, 12], expect.anything(), expect.anything());
    expect(result.uidReferencia).toBe(19);
  });

  it("releases the mailbox lock and logs out even when fetching fails", async () => {
    searchMock.mockResolvedValueOnce([11]);
    fetchMock.mockImplementationOnce(() => {
      throw new Error("fetch failed");
    });

    await expect(buscarMensagensNovas(params)).rejects.toThrow("fetch failed");

    expect(releaseMock).toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalled();
  });
});
