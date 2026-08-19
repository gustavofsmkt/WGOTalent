import { describe, it, expect } from "vitest";
import {
  candidatoSchema,
  candidatoAgregadoSchema,
  formacaoBaseSchema,
  formacaoSchema,
  type FormacaoInput,
} from "~/lib/validation/candidato";

describe("CandidatoForm - Formações Array & Validation Integration", () => {
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
});
