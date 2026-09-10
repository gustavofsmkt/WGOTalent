import { describe, it, expect } from "vitest";
import {
  candidatoSchema,
  formacaoSchema,
  experienciaSchema,
  certificacaoSchema,
  candidatoAgregadoSchema,
  candidatoFormSchema,
} from "./candidato";

describe("Validação de Candidato", () => {
  describe("formacaoSchema", () => {
    it("deve validar uma formação válida", () => {
      const data = {
        titulo: "Engenharia de Software",
        areaFormacao: "Tecnologia",
        dataInicio: "2018-01-01",
        dataTermino: "2022-12-31",
      };
      const result = formacaoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("deve falhar se data de término for anterior à data de início", () => {
      const data = {
        titulo: "Engenharia de Software",
        areaFormacao: "Tecnologia",
        dataInicio: "2022-12-31",
        dataTermino: "2018-01-01",
      };
      const result = formacaoSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("dataTermino");
      }
    });
  });

  describe("experienciaSchema", () => {
    it("deve validar uma experiência válida", () => {
      const data = {
        cargoTitulo: "Desenvolvedor Backend",
        dataEntrada: "2020-01-01",
      };
      const result = experienciaSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("deve falhar se data de saída for anterior à data de entrada", () => {
      const data = {
        cargoTitulo: "Desenvolvedor Backend",
        dataEntrada: "2020-01-01",
        dataSaida: "2019-12-31",
      };
      const result = experienciaSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("dataSaida");
      }
    });
  });

  describe("certificacaoSchema", () => {
    it("deve validar uma certificação válida", () => {
      const data = {
        titulo: "AWS Certified Developer",
        obtidaEm: "2023-01-01",
      };
      const result = certificacaoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("deve falhar se validade for anterior à data de obtenção", () => {
      const data = {
        titulo: "AWS Certified Developer",
        obtidaEm: "2023-01-01",
        validade: "2022-12-31",
      };
      const result = certificacaoSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("validade");
      }
    });
  });

  describe("candidatoSchema", () => {
    const validCandidato = {
      nome: "João da Silva",
      dataNascimento: "1990-01-01",
      email: "joao@example.com",
      celular: "11999999999",
      cep: "01000000",
      uf: "SP",
      cidade: "São Paulo",
      bairro: "Centro",
      logradouro: "Rua Exemplo, 123",
      resumoProfissional: "Desenvolvedor com experiência...",
    };

    it("deve validar um candidato válido", () => {
      const result = candidatoSchema.safeParse(validCandidato);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar e-mail inválido", () => {
      const data = { ...validCandidato, email: "email_invalido" };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("email");
      }
    });

    it("deve normalizar CEP com ponto de milhar (ex: 75.709-400) removendo o ponto", () => {
      const data = { ...validCandidato, cep: "75.709-400" };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cep).toBe("75709-400");
      }
    });

    it("deve rejeitar CEP que continua acima de 9 caracteres após normalizar", () => {
      const data = { ...validCandidato, cep: "75.709-4000" };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("cep");
      }
    });

    it("deve transformar string vazia de linkedin em null", () => {
      const data = { ...validCandidato, linkedin: "" };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.linkedin).toBeNull();
      }
    });

    it("deve assumir https:// quando o linkedin vem sem esquema", () => {
      const data = {
        ...validCandidato,
        linkedin: "www.linkedin.com/in/fulano",
      };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.linkedin).toBe("https://www.linkedin.com/in/fulano");
      }
    });

    it("não deve duplicar o esquema quando o portfolio já vem com http(s)://", () => {
      const data = { ...validCandidato, portfolio: "http://meusite.com" };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.portfolio).toBe("http://meusite.com");
      }
    });

    it("deve aceitar candidato sem data de nascimento", () => {
      const { dataNascimento: _omit, ...data } = validCandidato;
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dataNascimento).toBeNull();
      }
    });

    it("deve aceitar data de nascimento como string vazia (normaliza para null)", () => {
      const data = { ...validCandidato, dataNascimento: "" };
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dataNascimento).toBeNull();
      }
    });

    it("deve aceitar endereço apenas com cidade e uf (cep, bairro e logradouro opcionais)", () => {
      const {
        cep: _cep,
        bairro: _bairro,
        logradouro: _logradouro,
        ...data
      } = validCandidato;
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("deve exigir cidade e uf no endereço", () => {
      const { cidade: _cidade, ...data } = validCandidato;
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("cidade");
      }
    });

    it("deve rejeitar candidato sem resumo profissional (obrigatório)", () => {
      const { resumoProfissional: _omit, ...data } = validCandidato;
      const result = candidatoSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("resumoProfissional");
      }
    });
  });

  describe("candidatoFormSchema (contato obrigatório)", () => {
    const validCandidato = {
      nome: "João da Silva",
      uf: "SP",
      cidade: "São Paulo",
      resumoProfissional: "Desenvolvedor com experiência...",
    };

    it("deve aceitar candidato apenas com e-mail", () => {
      const data = { ...validCandidato, email: "joao@example.com" };
      const result = candidatoFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("deve aceitar candidato apenas com celular", () => {
      const data = { ...validCandidato, celular: "11999999999" };
      const result = candidatoFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar candidato sem e-mail e sem celular", () => {
      const result = candidatoFormSchema.safeParse(validCandidato);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.flatMap((i) => i.path);
        expect(paths).toContain("email");
        expect(paths).toContain("celular");
      }
    });
  });

  describe("candidatoAgregadoSchema", () => {
    const validCandidato = {
      nome: "João da Silva",
      dataNascimento: "1990-01-01",
      email: "joao@example.com",
      celular: "11999999999",
      cep: "01000000",
      uf: "SP",
      cidade: "São Paulo",
      bairro: "Centro",
      logradouro: "Rua Exemplo, 123",
      resumoProfissional: "Desenvolvedor com experiência...",
    };

    it("deve validar candidato agregado válido sem filhos", () => {
      const result = candidatoAgregadoSchema.safeParse(validCandidato);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formacoes).toEqual([]);
        expect(result.data.experiencias).toEqual([]);
        expect(result.data.certificacoes).toEqual([]);
      }
    });

    it("deve validar candidato agregado com filhos", () => {
      const data = {
        ...validCandidato,
        formacoes: [
          {
            titulo: "Engenharia de Software",
            areaFormacao: "Tecnologia",
            dataInicio: "2018-01-01",
          },
        ],
        experiencias: [
          {
            cargoTitulo: "Desenvolvedor Backend",
            dataEntrada: "2020-01-01",
          },
        ],
        certificacoes: [
          {
            titulo: "AWS Certified Developer",
          },
        ],
      };
      const result = candidatoAgregadoSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formacoes).toHaveLength(1);
        expect(result.data.experiencias).toHaveLength(1);
        expect(result.data.certificacoes).toHaveLength(1);
      }
    });
  });
});
