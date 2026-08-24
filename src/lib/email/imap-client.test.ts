import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  connectMock,
  getMailboxLockMock,
  searchMock,
  fetchMock,
  logoutMock,
  releaseMock,
  simpleParserMock,
} = vi.hoisted(() => ({
  connectMock: vi.fn(),
  getMailboxLockMock: vi.fn(),
  searchMock: vi.fn(),
  fetchMock: vi.fn(),
  logoutMock: vi.fn(),
  releaseMock: vi.fn(),
  simpleParserMock: vi.fn(),
}));

vi.mock("imapflow", () => ({
  ImapFlow: class {
    connect = connectMock;
    getMailboxLock = getMailboxLockMock;
    search = searchMock;
    fetch = fetchMock;
    logout = logoutMock;
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

  it("starts from UID 1 when the mailbox has never been captured", async () => {
    searchMock.mockResolvedValueOnce([]);

    await buscarMensagensNovas({ ...params, desdeUid: null });

    expect(searchMock).toHaveBeenCalledWith({ uid: "1:*" }, { uid: true });
  });

  it("returns an empty array without fetching when search finds nothing", async () => {
    searchMock.mockResolvedValueOnce(false);

    const result = await buscarMensagensNovas(params);

    expect(result).toEqual([]);
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

    expect(result).toEqual([
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

    expect(result).toEqual([]);
    expect(simpleParserMock).not.toHaveBeenCalled();
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
