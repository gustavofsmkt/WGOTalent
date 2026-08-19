import { describe, it, expect } from "vitest";
import {
  candidatoSchema,
  candidatoAgregadoSchema,
  formacaoBaseSchema,
  formacaoSchema,
  type FormacaoInput,
  experienciaBaseSchema,
  experienciaSchema,
  type ExperienciaInput,
  certificacaoBaseSchema,
  certificacaoSchema,
  type CertificacaoInput,
} from "~/lib/validation/candidato";

describe("CandidatoForm - Formações, Experiências & Certificações Array & Validation Integration", () => {
  const baseValidCandidato = {
    nome: "Ana Pereira da Silva",
    dataNascimento: "1992-05-15",
    email: "ana.pereira@example.com",
    celular: "11988887777",
    cep: "01310-100",
    uf: "SP",
    cidade: "São Paulo",
    bairro: "Bela Vista",
    logradouro: "Avenida Paulista, 1000",
    resumoProfissional: "Profissional de tecnologia com sólida formação acadêmica e foco em engenharia de dados.",
  };

  describe("formacoes array field validation", () => {
    it("validates candidate aggregate with multiple valid education entries", () => {
      const formacoes: FormacaoInput[] = [
        {
          titulo: "Bacharelado em Ciência da Computação",
          instituicao: "Universidade de São Paulo",
          areaFormacao: "Tecnologia da Informação",
          dataInicio: "2010-02-01",
          dataTermino: "2014-12-15",
        },
        {
          titulo: "Pós-graduação em Inteligência Artificial",
          instituicao: "FIAP",
          areaFormacao: "Ciência de Dados",
          dataInicio: "2016-03-01",
          dataTermino: null,
        },
      ];

      const input = {
        ...baseValidCandidato,
        formacoes,
      };

      const result = candidatoAgregadoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formacoes).toHaveLength(2);
        expect(result.data.formacoes[0]?.titulo).toBe("Bacharelado em Ciência da Computação");
        expect(result.data.formacoes[0]?.dataTermino).toBe("2014-12-15");
        expect(result.data.formacoes[1]?.dataTermino).toBeNull();
      }
    });

    it("accepts candidate with empty formacoes array by default", () => {
      const input = {
        ...baseValidCandidato,
        formacoes: [],
      };

      const result = candidatoAgregadoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formacoes).toEqual([]);
      }
    });

    it("rejects education entry with invalid dates where dataTermino is before dataInicio", () => {
      const invalidFormacao: FormacaoInput = {
        titulo: "Bacharelado em Sistemas",
        instituicao: "USP",
        areaFormacao: "Tecnologia",
        dataInicio: "2020-01-01",
        dataTermino: "2019-12-31",
      };

      const result = formacaoSchema.safeParse(invalidFormacao);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("dataTermino");
        expect(result.error.issues[0]?.message).toBe(
          "A data de término deve ser posterior ou igual à data de início"
        );
      }
    });

    it("validates onBlur field schema for formacao 'titulo'", () => {
      const tituloSchema = formacaoBaseSchema.shape.titulo;

      const validTitulo = tituloSchema.safeParse("Engenharia de Software");
      expect(validTitulo.success).toBe(true);

      const emptyTitulo = tituloSchema.safeParse("");
      expect(emptyTitulo.success).toBe(false);

      const whitespaceTitulo = tituloSchema.safeParse("   ");
      expect(whitespaceTitulo.success).toBe(false);

      const longTitulo = tituloSchema.safeParse("a".repeat(151));
      expect(longTitulo.success).toBe(false);
    });

    it("validates onBlur field schema for formacao 'areaFormacao'", () => {
      const areaSchema = formacaoBaseSchema.shape.areaFormacao;

      const validArea = areaSchema.safeParse("Administração");
      expect(validArea.success).toBe(true);

      const emptyArea = areaSchema.safeParse("");
      expect(emptyArea.success).toBe(false);

      const longArea = areaSchema.safeParse("a".repeat(121));
      expect(longArea.success).toBe(false);
    });

    it("validates onBlur field schema for formacao 'instituicao'", () => {
      const instituicaoSchema = formacaoBaseSchema.shape.instituicao;

      const validInst = instituicaoSchema.safeParse("USP");
      expect(validInst.success).toBe(true);

      const nullInst = instituicaoSchema.safeParse(null);
      expect(nullInst.success).toBe(true);

      const emptyInst = instituicaoSchema.safeParse("");
      expect(emptyInst.success).toBe(true);

      const longInst = instituicaoSchema.safeParse("a".repeat(151));
      expect(longInst.success).toBe(false);
    });

    it("validates onBlur field schema for formacao 'dataInicio'", () => {
      const dataInicioSchema = formacaoBaseSchema.shape.dataInicio;

      const validDate = dataInicioSchema.safeParse("2020-02-15");
      expect(validDate.success).toBe(true);

      const emptyDate = dataInicioSchema.safeParse("");
      expect(emptyDate.success).toBe(false);

      const invalidDate = dataInicioSchema.safeParse("15/02/2020");
      expect(invalidDate.success).toBe(false);
    });

    it("validates onBlur field schema for formacao 'dataTermino'", () => {
      const dataTerminoSchema = formacaoBaseSchema.shape.dataTermino;

      const validDate = dataTerminoSchema.safeParse("2024-12-31");
      expect(validDate.success).toBe(true);

      const nullDate = dataTerminoSchema.safeParse(null);
      expect(nullDate.success).toBe(true);

      const invalidDate = dataTerminoSchema.safeParse("2024-13-45");
      expect(invalidDate.success).toBe(false);
    });
  });

  describe("experiencias array field validation", () => {
    it("validates candidate aggregate with multiple valid experience entries", () => {
      const experiencias: ExperienciaInput[] = [
        {
          cargoTitulo: "Desenvolvedor Frontend Sênior",
          empresa: "Tech Corp",
          dataEntrada: "2020-03-01",
          dataSaida: "2023-08-31",
          descricao: "Desenvolvimento de interfaces React e Next.js com foco em acessibilidade.",
        },
        {
          cargoTitulo: "Líder Técnico Frontend",
          empresa: "Inovação Digital",
          dataEntrada: "2023-09-01",
          dataSaida: null, // Experiência atual
          descricao: "Liderança de equipe ágil e arquitetura de componentes.",
        },
      ];

      const input = {
        ...baseValidCandidato,
        experiencias,
      };

      const result = candidatoAgregadoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.experiencias).toHaveLength(2);
        expect(result.data.experiencias[0]?.cargoTitulo).toBe("Desenvolvedor Frontend Sênior");
        expect(result.data.experiencias[0]?.dataSaida).toBe("2023-08-31");
        expect(result.data.experiencias[1]?.cargoTitulo).toBe("Líder Técnico Frontend");
        expect(result.data.experiencias[1]?.dataSaida).toBeNull();
      }
    });

    it("accepts candidate with empty experiencias array by default", () => {
      const input = {
        ...baseValidCandidato,
        experiencias: [],
      };

      const result = candidatoAgregadoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.experiencias).toEqual([]);
      }
    });

    it("rejects experience entry where dataSaida is before dataEntrada", () => {
      const invalidExperiencia: ExperienciaInput = {
        cargoTitulo: "Analista de Sistemas",
        empresa: "Empresa ABC",
        dataEntrada: "2022-01-01",
        dataSaida: "2021-12-31",
      };

      const result = experienciaSchema.safeParse(invalidExperiencia);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("dataSaida");
        expect(result.error.issues[0]?.message).toBe(
          "A data de saída deve ser posterior ou igual à data de entrada"
        );
      }
    });

    it("validates onBlur field schema for experiencia 'cargoTitulo'", () => {
      const cargoSchema = experienciaBaseSchema.shape.cargoTitulo;

      const validCargo = cargoSchema.safeParse("Engenheiro de Dados");
      expect(validCargo.success).toBe(true);

      const emptyCargo = cargoSchema.safeParse("");
      expect(emptyCargo.success).toBe(false);

      const whitespaceCargo = cargoSchema.safeParse("   ");
      expect(whitespaceCargo.success).toBe(false);

      const longCargo = cargoSchema.safeParse("a".repeat(151));
      expect(longCargo.success).toBe(false);
    });

    it("validates onBlur field schema for experiencia 'empresa'", () => {
      const empresaSchema = experienciaBaseSchema.shape.empresa;

      const validEmpresa = empresaSchema.safeParse("WGO Telecom");
      expect(validEmpresa.success).toBe(true);

      const nullEmpresa = empresaSchema.safeParse(null);
      expect(nullEmpresa.success).toBe(true);

      const emptyEmpresa = empresaSchema.safeParse("");
      expect(emptyEmpresa.success).toBe(true);

      const longEmpresa = empresaSchema.safeParse("a".repeat(151));
      expect(longEmpresa.success).toBe(false);
    });

    it("validates onBlur field schema for experiencia 'dataEntrada'", () => {
      const dataEntradaSchema = experienciaBaseSchema.shape.dataEntrada;

      const validDate = dataEntradaSchema.safeParse("2021-06-01");
      expect(validDate.success).toBe(true);

      const emptyDate = dataEntradaSchema.safeParse("");
      expect(emptyDate.success).toBe(false);

      const invalidDate = dataEntradaSchema.safeParse("01/06/2021");
      expect(invalidDate.success).toBe(false);
    });

    it("validates onBlur field schema for experiencia 'dataSaida'", () => {
      const dataSaidaSchema = experienciaBaseSchema.shape.dataSaida;

      const validDate = dataSaidaSchema.safeParse("2023-12-31");
      expect(validDate.success).toBe(true);

      const nullDate = dataSaidaSchema.safeParse(null);
      expect(nullDate.success).toBe(true);

      const invalidDate = dataSaidaSchema.safeParse("2023-99-99");
      expect(invalidDate.success).toBe(false);
    });

    it("validates onBlur field schema for experiencia 'descricao'", () => {
      const descricaoSchema = experienciaBaseSchema.shape.descricao;

      const validDesc = descricaoSchema.safeParse("Responsável pela sustentação e novas features.");
      expect(validDesc.success).toBe(true);

      const nullDesc = descricaoSchema.safeParse(null);
      expect(nullDesc.success).toBe(true);

      const emptyDesc = descricaoSchema.safeParse("");
      expect(emptyDesc.success).toBe(true);
    });
  });

  describe("certificacoes array field validation", () => {
    it("validates candidate aggregate with multiple valid certification entries", () => {
      const certificacoes: CertificacaoInput[] = [
        {
          titulo: "AWS Certified Solutions Architect - Associate",
          obtidaEm: "2022-04-10",
          validade: "2025-04-10",
        },
        {
          titulo: "Certificação NR10 - Segurança em Instalações e Serviços em Eletricidade",
          obtidaEm: "2023-01-15",
          validade: "2025-01-15",
        },
        {
          titulo: "Scrum Master Professional (PSM I)",
          obtidaEm: "2021-08-20",
          validade: null, // Sem expiração
        },
      ];

      const input = {
        ...baseValidCandidato,
        certificacoes,
      };

      const result = candidatoAgregadoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.certificacoes).toHaveLength(3);
        expect(result.data.certificacoes[0]?.titulo).toBe(
          "AWS Certified Solutions Architect - Associate"
        );
        expect(result.data.certificacoes[0]?.validade).toBe("2025-04-10");
        expect(result.data.certificacoes[2]?.validade).toBeNull();
      }
    });

    it("accepts candidate with empty certificacoes array by default", () => {
      const input = {
        ...baseValidCandidato,
        certificacoes: [],
      };

      const result = candidatoAgregadoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.certificacoes).toEqual([]);
      }
    });

    it("rejects certification entry where validade is before obtidaEm", () => {
      const invalidCertificacao: CertificacaoInput = {
        titulo: "Certificação ITIL v4",
        obtidaEm: "2023-05-01",
        validade: "2022-05-01",
      };

      const result = certificacaoSchema.safeParse(invalidCertificacao);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("validade");
        expect(result.error.issues[0]?.message).toBe(
          "A validade deve ser posterior ou igual à data de obtenção"
        );
      }
    });

    it("validates onBlur field schema for certificacao 'titulo'", () => {
      const tituloSchema = certificacaoBaseSchema.shape.titulo;

      const validTitulo = tituloSchema.safeParse("Kubernetes CKA");
      expect(validTitulo.success).toBe(true);

      const emptyTitulo = tituloSchema.safeParse("");
      expect(emptyTitulo.success).toBe(false);

      const whitespaceTitulo = tituloSchema.safeParse("   ");
      expect(whitespaceTitulo.success).toBe(false);

      const longTitulo = tituloSchema.safeParse("a".repeat(151));
      expect(longTitulo.success).toBe(false);
    });

    it("validates onBlur field schema for certificacao 'obtidaEm'", () => {
      const obtidaEmSchema = certificacaoBaseSchema.shape.obtidaEm;

      const validDate = obtidaEmSchema.safeParse("2023-06-15");
      expect(validDate.success).toBe(true);

      const nullDate = obtidaEmSchema.safeParse(null);
      expect(nullDate.success).toBe(true);

      const undefinedDate = obtidaEmSchema.safeParse(undefined);
      expect(undefinedDate.success).toBe(true);

      const invalidDate = obtidaEmSchema.safeParse("2023-15-40");
      expect(invalidDate.success).toBe(false);
    });

    it("validates onBlur field schema for certificacao 'validade'", () => {
      const validadeSchema = certificacaoBaseSchema.shape.validade;

      const validDate = validadeSchema.safeParse("2026-12-31");
      expect(validDate.success).toBe(true);

      const nullDate = validadeSchema.safeParse(null);
      expect(nullDate.success).toBe(true);

      const undefinedDate = validadeSchema.safeParse(undefined);
      expect(undefinedDate.success).toBe(true);

      const invalidDate = validadeSchema.safeParse("not-a-date");
      expect(invalidDate.success).toBe(false);
    });
  });

  describe("full candidate aggregate with formacoes, experiencias and certificacoes", () => {
    it("validates complete candidate payload with all nested typed arrays", () => {
      const completePayload = {
        ...baseValidCandidato,
        formacoes: [
          {
            titulo: "Engenharia de Telecomunicações",
            instituicao: "INATEL",
            areaFormacao: "Engenharia",
            dataInicio: "2015-02-01",
            dataTermino: "2019-12-10",
          },
        ],
        experiencias: [
          {
            cargoTitulo: "Engenheiro de Redes Jr.",
            empresa: "WGO Telecom",
            dataEntrada: "2020-01-15",
            dataSaida: null,
            descricao: "Suporte e configuração de infraestrutura de fibra óptica.",
          },
        ],
        certificacoes: [
          {
            titulo: "Cisco CCNA",
            obtidaEm: "2020-05-10",
            validade: "2023-05-10",
          },
          {
            titulo: "NR35 - Trabalho em Altura",
            obtidaEm: "2023-02-01",
            validade: "2025-02-01",
          },
        ],
      };

      const result = candidatoAgregadoSchema.safeParse(completePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formacoes).toHaveLength(1);
        expect(result.data.experiencias).toHaveLength(1);
        expect(result.data.certificacoes).toHaveLength(2);
      }
    });
  });
});
