import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../../env.js";
import {
  departamentos,
  cargos,
  vagas,
  candidatos,
  candidatoFormacoes,
  candidatoExperiencias,
  candidatoCertificacoes,
  triagens,
  avaliacaoIA,
} from "./schema.ts";

export async function seed() {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set.");
    throw new Error("DATABASE_URL is not set.");
  }

  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ":***@");
  console.log(`🌱 Seeding database at: ${maskedUrl}`);

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    console.log("🧹 Clearing existing data in reverse dependency order...");
    await db.delete(avaliacaoIA);
    await db.delete(triagens);
    await db.delete(candidatoCertificacoes);
    await db.delete(candidatoExperiencias);
    await db.delete(candidatoFormacoes);
    await db.delete(candidatos);
    await db.delete(vagas);
    await db.delete(cargos);
    await db.delete(departamentos);

    console.log("🏢 Seeding Departamentos...");
    const [depTI, depRH, depComercial, depOperacoes, depFinanceiro] = await db
      .insert(departamentos)
      .values([
        {
          nome: "Tecnologia da Informação",
          descricao:
            "Departamento responsável pelo desenvolvimento de software, infraestrutura de TI, segurança da informação e suporte tecnológico corporativo.",
        },
        {
          nome: "Recursos Humanos",
          descricao:
            "Departamento encarregado de atração e seleção de talentos, desenvolvimento organizacional, treinamento e gestão de pessoas.",
        },
        {
          nome: "Comercial & Vendas",
          descricao:
            "Departamento responsável por prospecção de novos clientes, expansão de contas corporativas B2B e atendimento comercial.",
        },
        {
          nome: "Operações & Logística",
          descricao:
            "Departamento responsável pela gestão operacional, logística integrada, cadeia de suprimentos e atendimento de campo.",
        },
        {
          nome: "Financeiro & Controladoria",
          descricao:
            "Departamento responsável pelo planejamento financeiro, contabilidade, controladoria e rotinas de tesouraria.",
        },
      ])
      .returning();

    if (!depTI || !depRH || !depComercial || !depOperacoes || !depFinanceiro) {
      throw new Error("Failed to insert departamentos");
    }

    console.log("💼 Seeding Cargos...");
    const [
      cargoDevSenior,
      cargoDevops,
      cargoAnalistaRH,
      cargoExecutivoVendas,
      cargoCoordLogistica,
      cargoAnalistaFinanceiro,
    ] = await db
      .insert(cargos)
      .values([
        {
          departamentoId: depTI.id,
          titulo: "Desenvolvedor(a) Full Stack Sênior",
          descricao:
            "Atuação no desenvolvimento e sustentação de aplicações web modernas utilizando React, Next.js, Node.js e PostgreSQL.",
          faixaSalarial: "14000.00",
          requisitos:
            "Experiência sólida com TypeScript, React/Next.js, Node.js, bancos relacionais PostgreSQL e arquitetura de microsserviços/APIs REST.",
          requisitosDesejaveis:
            "Conhecimento em Docker, CI/CD, testes automatizados (Vitest/Playwright) e mensageria.",
          criteriosEliminatorios:
            "Menos de 4 anos de experiência com desenvolvimento web; ausência de conhecimento prático em TypeScript e SQL.",
          ativo: true,
        },
        {
          departamentoId: depTI.id,
          titulo: "Engenheiro(a) de DevOps Pleno",
          descricao:
            "Construção e sustentação de pipelines CI/CD, infraestrutura em nuvem e monitoramento de ambientes de produção.",
          faixaSalarial: "10500.00",
          requisitos:
            "Experiência com Docker, Kubernetes, Linux, Terraform e automação de pipelines CI/CD.",
          requisitosDesejaveis:
            "Certificação AWS ou GCP; experiência com observabilidade (Prometheus/Grafana).",
          criteriosEliminatorios:
            "Falta de vivência com containers Docker e ambientes Linux.",
          ativo: true,
        },
        {
          departamentoId: depRH.id,
          titulo: "Analista de Recursos Humanos Pleno",
          descricao:
            "Condução de processos seletivos ponta a ponta, alinhamento de perfis com gestores e ações de clima organizacional.",
          faixaSalarial: "6500.00",
          requisitos:
            "Experiência em recrutamento e seleção para posições operacionais e corporativas, aplicação de testes comportamentais.",
          requisitosDesejaveis:
            "Conhecimento em plataformas ATS e metodologias ágeis de contratação.",
          criteriosEliminatorios: "Menos de 2 anos de atuação na área de R&S.",
          ativo: true,
        },
        {
          departamentoId: depComercial.id,
          titulo: "Executivo(a) de Contas Corporativas (B2B)",
          descricao:
            "Prospecção ativa de contas Enterprise, negociação de propostas de alto valor e acompanhamento do ciclo de vendas.",
          faixaSalarial: "8000.00",
          requisitos:
            "Experiência prévia em vendas consultivas B2B, técnicas de negociação SPIN Selling e domínio de CRM.",
          requisitosDesejaveis:
            "Inglês intermediário/avançado; carteira de clientes corporativos.",
          criteriosEliminatorios:
            "Falta de experiência em ciclo de vendas B2B complexas.",
          ativo: true,
        },
        {
          departamentoId: depOperacoes.id,
          titulo: "Coordenador(a) de Logística e Distribuição",
          descricao:
            "Supervisão da equipe de armazenagem, roteirização de entregas, controle de estoque e auditoria de fretes.",
          faixaSalarial: "9200.00",
          requisitos:
            "Experiência com gestão de equipes operacionais, ERPs de logística e indicadores de desempenho (KPIs).",
          requisitosDesejaveis:
            "Pós-graduação em Supply Chain; domínio avançado de Excel e ferramentas BI.",
          criteriosEliminatorios:
            "Não possuir CNH B ativa; indisponibilidade para supervisão presencial diária.",
          ativo: true,
        },
        {
          departamentoId: depFinanceiro.id,
          titulo: "Analista Financeiro Pleno",
          descricao:
            "Execução das rotinas diárias de tesouraria, fluxo de caixa, conciliação bancária e suporte a auditorias financeiras.",
          faixaSalarial: "6200.00",
          requisitos:
            "Graduação completa em Ciências Contábeis, Administração ou Economia; experiência com rotinas financeiras.",
          requisitosDesejaveis:
            "Experiência com sistemas integrados ERP e conciliação de cartões.",
          criteriosEliminatorios:
            "Falta de formação superior na área afim ou experiência menor que 2 anos.",
          ativo: false,
        },
      ])
      .returning();

    if (
      !cargoDevSenior ||
      !cargoDevops ||
      !cargoAnalistaRH ||
      !cargoExecutivoVendas ||
      !cargoCoordLogistica ||
      !cargoAnalistaFinanceiro
    ) {
      throw new Error("Failed to insert cargos");
    }

    console.log("📌 Seeding Vagas...");
    const [
      vagaDevSP,
      vagaDevopsBH,
      vagaRHPR,
      vagaVendasSP,
      vagaLogRJ,
      vagaDevFloripa,
    ] = await db
      .insert(vagas)
      .values([
        {
          cargoId: cargoDevSenior.id,
          status: "aberta",
          posicoesDisponiveis: 2,
          remuneracaoOferecida: "14500.00",
          cidade: "São Paulo",
          uf: "SP",
        },
        {
          cargoId: cargoDevops.id,
          status: "aberta",
          posicoesDisponiveis: 1,
          remuneracaoOferecida: "10500.00",
          cidade: "Belo Horizonte",
          uf: "MG",
        },
        {
          cargoId: cargoAnalistaRH.id,
          status: "pausada",
          posicoesDisponiveis: 1,
          remuneracaoOferecida: "6500.00",
          cidade: "Curitiba",
          uf: "PR",
        },
        {
          cargoId: cargoExecutivoVendas.id,
          status: "concluida",
          posicoesDisponiveis: 1,
          remuneracaoOferecida: "8500.00",
          cidade: "São Paulo",
          uf: "SP",
        },
        {
          cargoId: cargoCoordLogistica.id,
          status: "cancelada",
          posicoesDisponiveis: 1,
          remuneracaoOferecida: "9000.00",
          cidade: "Rio de Janeiro",
          uf: "RJ",
        },
        {
          cargoId: cargoDevSenior.id,
          status: "incompleta",
          posicoesDisponiveis: 1,
          remuneracaoOferecida: null,
          cidade: "Florianópolis",
          uf: "SC",
        },
      ])
      .returning();

    if (
      !vagaDevSP ||
      !vagaDevopsBH ||
      !vagaRHPR ||
      !vagaVendasSP ||
      !vagaLogRJ ||
      !vagaDevFloripa
    ) {
      throw new Error("Failed to insert vagas");
    }

    console.log("👤 Seeding Candidatos (Dados Fictícios)...");
    const [
      candLucas,
      candMariana,
      candJuliana,
      candRoberto,
      candPatricia,
      candThiago,
    ] = await db
      .insert(candidatos)
      .values([
        {
          nome: "Lucas Albuquerque Silva",
          nomeSocial: null,
          nacionalidade: "brasileira",
          dataNascimento: "1991-04-12",
          estadoCivil: "casado",
          pcd: null,
          email: "lucas.albuquerque.dev@exemplo.com.br",
          celular: "(11) 98765-1001",
          cep: "05422-000",
          uf: "SP",
          cidade: "São Paulo",
          bairro: "Pinheiros",
          logradouro: "Rua dos Pinheiros, 100",
          resumoProfissional:
            "Engenheiro de software com mais de 8 anos de experiência em desenvolvimento web full stack com React, Node.js e PostgreSQL.",
          cnh: "b",
          possuiVeiculo: true,
          ensinoMedioConcluido: true,
          cargoInteresseId: cargoDevSenior.id,
          areaInteresseId: depTI.id,
          disponivelViagens: true,
          disponivelMudanca: false,
          disponibilidadeHorarios: "Comercial flexível / Híbrido",
          inicioImediato: true,
          linkedin: "https://linkedin.com/in/lucas-silva-ficticio",
          portfolio: "https://lucasdev.ficticio.io",
          origem: "indicacao",
          curriculoArquivoKey: "curriculos/lucas-albuquerque-silva.pdf",
          textoCurriculoExtraido:
            "LUCAS ALBUQUERQUE SILVA\nDesenvolvedor Full Stack Sênior\nSão Paulo - SP | lucas.albuquerque.dev@exemplo.com.br\n\nResumo:\nProfissional com 8 anos de atuação em TypeScript, React, Next.js, Node.js e PostgreSQL.",
        },
        {
          nome: "Mariana Vasconcelos Costa",
          nomeSocial: null,
          nacionalidade: "brasileira",
          dataNascimento: "1994-08-23",
          estadoCivil: "solteiro",
          pcd: null,
          email: "mariana.costa.devops@exemplo.com.br",
          celular: "(31) 98765-2002",
          cep: "30140-060",
          uf: "MG",
          cidade: "Belo Horizonte",
          bairro: "Savassi",
          logradouro: "Avenida Getúlio Vargas, 250",
          resumoProfissional:
            "Especialista em infraestrutura em nuvem, automação CI/CD com GitHub Actions e orquestração de containers Docker e Kubernetes.",
          cnh: "b",
          possuiVeiculo: false,
          ensinoMedioConcluido: true,
          cargoInteresseId: cargoDevops.id,
          areaInteresseId: depTI.id,
          disponivelViagens: false,
          disponivelMudanca: true,
          disponibilidadeHorarios: "Horário comercial",
          inicioImediato: false,
          linkedin: "https://linkedin.com/in/mariana-costa-ficticio",
          portfolio: null,
          origem: "email",
          curriculoArquivoKey: "curriculos/mariana-vasconcelos-costa.pdf",
          textoCurriculoExtraido:
            "MARIANA VASCONCELOS COSTA\nEngenheira de DevOps\nBelo Horizonte - MG | mariana.costa.devops@exemplo.com.br\n\nExperiência em AWS, Terraform, Docker, Kubernetes e CI/CD.",
        },
        {
          nome: "Juliana Mendes Ferreira",
          nomeSocial: null,
          nacionalidade: "brasileira",
          dataNascimento: "1993-11-15",
          estadoCivil: "uniao_estavel",
          pcd: null,
          email: "juliana.ferreira.rh@exemplo.com.br",
          celular: "(41) 98765-3003",
          cep: "80420-010",
          uf: "PR",
          cidade: "Curitiba",
          bairro: "Batel",
          logradouro: "Rua Bispo Dom José, 400",
          resumoProfissional:
            "Analista de Recursos Humanos com foco em atração de talentos de tecnologia, aplicação de dinâmicas e entrevistas por competências.",
          cnh: "a",
          possuiVeiculo: true,
          ensinoMedioConcluido: true,
          cargoInteresseId: cargoAnalistaRH.id,
          areaInteresseId: depRH.id,
          disponivelViagens: true,
          disponivelMudanca: true,
          disponibilidadeHorarios: "Integral",
          inicioImediato: true,
          linkedin: "https://linkedin.com/in/juliana-mendes-ficticio",
          portfolio: null,
          origem: "manual",
          curriculoArquivoKey: "curriculos/juliana-mendes-ferreira.pdf",
          textoCurriculoExtraido:
            "JULIANA MENDES FERREIRA\nAnalista de Recursos Humanos\nCuritiba - PR | juliana.ferreira.rh@exemplo.com.br\n\nExperiência de 4 anos em Recrutamento e Seleção de Tecnologia.",
        },
        {
          nome: "Roberto Carlos Santos",
          nomeSocial: null,
          nacionalidade: "brasileira",
          dataNascimento: "1988-02-28",
          estadoCivil: "casado",
          pcd: null,
          email: "roberto.santos.vendas@exemplo.com.br",
          celular: "(11) 98765-4004",
          cep: "04543-000",
          uf: "SP",
          cidade: "São Paulo",
          bairro: "Vila Olímpia",
          logradouro: "Rua Funchal, 500",
          resumoProfissional:
            "Executivo comercial sênior com 10 anos de experiência em vendas corporativas de software B2B e expansão de mercado.",
          cnh: "ab",
          possuiVeiculo: true,
          ensinoMedioConcluido: true,
          cargoInteresseId: cargoExecutivoVendas.id,
          areaInteresseId: depComercial.id,
          disponivelViagens: true,
          disponivelMudanca: false,
          disponibilidadeHorarios: "Comercial / Viagens",
          inicioImediato: true,
          linkedin: "https://linkedin.com/in/roberto-santos-ficticio",
          portfolio: null,
          origem: "manual",
          curriculoArquivoKey: "curriculos/roberto-carlos-santos.pdf",
          textoCurriculoExtraido:
            "ROBERTO CARLOS SANTOS\nExecutivo de Contas Corporativas B2B\nSão Paulo - SP | roberto.santos.vendas@exemplo.com.br\n\nEspecialista em vendas complexas, CRM Salesforce e prospecção Enterprise.",
        },
        {
          nome: "Patricia Helena Souza",
          nomeSocial: null,
          nacionalidade: "brasileira",
          dataNascimento: "1990-06-10",
          estadoCivil: "solteiro",
          pcd: "Deficiência auditiva leve unilateral",
          email: "patricia.souza.log@exemplo.com.br",
          celular: "(21) 98765-5005",
          cep: "22640-100",
          uf: "RJ",
          cidade: "Rio de Janeiro",
          bairro: "Barra da Tijuca",
          logradouro: "Avenida das Américas, 800",
          resumoProfissional:
            "Supervisora logística com ampla vivência em centros de distribuição e gestão de frotas comerciais.",
          cnh: "c",
          possuiVeiculo: true,
          ensinoMedioConcluido: true,
          cargoInteresseId: cargoCoordLogistica.id,
          areaInteresseId: depOperacoes.id,
          disponivelViagens: false,
          disponivelMudanca: false,
          disponibilidadeHorarios: "Turno diurno / Escala",
          inicioImediato: false,
          linkedin: "https://linkedin.com/in/patricia-souza-ficticio",
          portfolio: null,
          origem: "email",
          curriculoArquivoKey: "curriculos/patricia-helena-souza.pdf",
          textoCurriculoExtraido:
            "PATRICIA HELENA SOUZA\nCoordenadora de Logística\nRio de Janeiro - RJ | patricia.souza.log@exemplo.com.br\n\nGestão de CDs, indicadores de frete e liderança de equipes operacionais.",
        },
        {
          nome: "Thiago Nogueira Lima",
          nomeSocial: null,
          nacionalidade: "brasileira",
          dataNascimento: "1998-05-18",
          estadoCivil: "solteiro",
          pcd: null,
          email: "thiago.nogueira.dev@exemplo.com.br",
          celular: "(48) 98765-6006",
          cep: "88034-000",
          uf: "SC",
          cidade: "Florianópolis",
          bairro: "Itacorubi",
          logradouro: "Rodovia Amaro Antônio Vieira, 120",
          resumoProfissional:
            "Desenvolvedor frontend júnior em transição para full stack com conhecimentos em JavaScript, React e Node.js.",
          cnh: null,
          possuiVeiculo: false,
          ensinoMedioConcluido: true,
          cargoInteresseId: cargoDevSenior.id,
          areaInteresseId: depTI.id,
          disponivelViagens: false,
          disponivelMudanca: true,
          disponibilidadeHorarios: "Período integral",
          inicioImediato: true,
          linkedin: "https://linkedin.com/in/thiago-lima-ficticio",
          portfolio: "https://thiagolima.ficticio.dev",
          origem: "email",
          curriculoArquivoKey: "curriculos/thiago-nogueira-lima.pdf",
          textoCurriculoExtraido:
            "THIAGO NOGUEIRA LIMA\nDesenvolvedor Júnior\nFlorianópolis - SC | thiago.nogueira.dev@exemplo.com.br\n\nConhecimento em React, JavaScript, HTML/CSS e Git.",
        },
      ])
      .returning();

    if (
      !candLucas ||
      !candMariana ||
      !candJuliana ||
      !candRoberto ||
      !candPatricia ||
      !candThiago
    ) {
      throw new Error("Failed to insert candidatos");
    }

    console.log("🎓 Seeding Formações...");
    await db.insert(candidatoFormacoes).values([
      {
        candidatoId: candLucas.id,
        titulo: "Bacharelado em Ciência da Computação",
        instituicao: "Universidade de São Paulo (USP)",
        areaFormacao: "Tecnologia da Informação",
        dataInicio: "2010-02-01",
        dataTermino: "2014-12-15",
      },
      {
        candidatoId: candLucas.id,
        titulo: "Especialização em Arquitetura de Software",
        instituicao: "FIAP",
        areaFormacao: "Engenharia de Software",
        dataInicio: "2016-03-01",
        dataTermino: "2017-08-30",
      },
      {
        candidatoId: candMariana.id,
        titulo: "Bacharelado em Sistemas de Informação",
        instituicao: "UFMG",
        areaFormacao: "Tecnologia da Informação",
        dataInicio: "2013-03-01",
        dataTermino: "2017-12-10",
      },
      {
        candidatoId: candJuliana.id,
        titulo: "Graduação em Psicologia",
        instituicao: "Universidade Federal do Paraná (UFPR)",
        areaFormacao: "Psicologia Organizacional",
        dataInicio: "2012-02-15",
        dataTermino: "2016-12-20",
      },
      {
        candidatoId: candRoberto.id,
        titulo: "Bacharelado em Administração de Empresas",
        instituicao: "Fundação Getulio Vargas (FGV)",
        areaFormacao: "Administração e Negócios",
        dataInicio: "2007-02-01",
        dataTermino: "2011-12-15",
      },
      {
        candidatoId: candPatricia.id,
        titulo: "Tecnólogo em Logística",
        instituicao: "Centro Universitário Carioca",
        areaFormacao: "Logística e Supply Chain",
        dataInicio: "2009-02-01",
        dataTermino: "2011-12-15",
      },
      {
        candidatoId: candThiago.id,
        titulo: "Tecnólogo em Análise e Desenvolvimento de Sistemas",
        instituicao: "IFSC",
        areaFormacao: "Desenvolvimento de Software",
        dataInicio: "2020-03-01",
        dataTermino: "2023-07-15",
      },
    ]);

    console.log("🏢 Seeding Experiências Profissionais...");
    await db.insert(candidatoExperiencias).values([
      {
        candidatoId: candLucas.id,
        empresa: "Tech Solutions Brasil",
        cargoTitulo: "Engenheiro de Software Sênior",
        descricao:
          "Liderança técnica de squad no desenvolvimento de microsserviços em Node.js e interfaces em Next.js.",
        dataEntrada: "2020-03-01",
        dataSaida: null,
      },
      {
        candidatoId: candLucas.id,
        empresa: "Inova Web Soluções",
        cargoTitulo: "Desenvolvedor Full Stack Pleno",
        descricao:
          "Desenvolvimento de aplicações web responsivas com React, TypeScript e PostgreSQL.",
        dataEntrada: "2016-01-15",
        dataSaida: "2020-02-28",
      },
      {
        candidatoId: candMariana.id,
        empresa: "Cloud Native Minas",
        cargoTitulo: "Analista de DevOps Pleno",
        descricao:
          "Implementação de esteiras CI/CD, gerenciamento de clusters Kubernetes na AWS e automação com Terraform.",
        dataEntrada: "2021-05-01",
        dataSaida: null,
      },
      {
        candidatoId: candJuliana.id,
        empresa: "Talentos & Pessoas Consultoria",
        cargoTitulo: "Analista de R&S Pleno",
        descricao:
          "Condução de processos seletivos para área de tecnologia, hunting ativo no LinkedIn e alinhamento de vagas.",
        dataEntrada: "2019-06-01",
        dataSaida: null,
      },
      {
        candidatoId: candRoberto.id,
        empresa: "Enterprise SaaS Corp",
        cargoTitulo: "Executivo de Vendas Enterprise",
        descricao:
          "Fechamento de contratos B2B de soluções de software corporativo com ticket médio de R$ 200k/ano.",
        dataEntrada: "2017-04-01",
        dataSaida: "2024-01-31",
      },
      {
        candidatoId: candPatricia.id,
        empresa: "TransLogística Sudeste",
        cargoTitulo: "Supervisora de Operações e Frota",
        descricao:
          "Supervisão direta de equipe de 35 motoristas e operadores de empilhadeira, controle de SLA e KPIs de entrega.",
        dataEntrada: "2018-08-01",
        dataSaida: "2023-10-31",
      },
      {
        candidatoId: candThiago.id,
        empresa: "Agência Digital Floripa",
        cargoTitulo: "Desenvolvedor Frontend Júnior",
        descricao:
          "Desenvolvimento de landing pages e manutenções corretivas em componentes React.",
        dataEntrada: "2023-08-01",
        dataSaida: null,
      },
    ]);

    console.log("📜 Seeding Certificações...");
    await db.insert(candidatoCertificacoes).values([
      {
        candidatoId: candLucas.id,
        titulo: "AWS Certified Solutions Architect – Associate",
        obtidaEm: "2022-04-10",
        validade: "2025-04-10",
      },
      {
        candidatoId: candMariana.id,
        titulo: "Certified Kubernetes Administrator (CKA)",
        obtidaEm: "2023-01-15",
        validade: "2026-01-15",
      },
      {
        candidatoId: candMariana.id,
        titulo: "HashiCorp Certified: Terraform Associate",
        obtidaEm: "2022-09-20",
        validade: "2024-09-20",
      },
      {
        candidatoId: candJuliana.id,
        titulo: "Analista Comportamental DISC Certificada",
        obtidaEm: "2020-10-05",
        validade: null,
      },
      {
        candidatoId: candRoberto.id,
        titulo: "Metodologia de Vendas Consultivas SPIN Selling",
        obtidaEm: "2018-05-12",
        validade: null,
      },
    ]);

    console.log("🔍 Seeding Triagens (Cobrindo múltiplos estados)...");
    const [
      triagemLucasVaga1,
      triagemThiagoVaga1,
      triagemMarianaVaga2,
      triagemJulianaVaga3,
      triagemRobertoVaga4,
      triagemPatriciaVaga5,
      triagemLucasVaga6,
    ] = await db
      .insert(triagens)
      .values([
        {
          vagaId: vagaDevSP.id,
          candidatoId: candLucas.id,
          etapa: "entrevista_gestor",
          resultado: "em_andamento",
          motivo: null,
          parecerRhEntrevistaRh:
            "Candidato demonstrou excelente domínio técnico na entrevista com o time de RH. Alinhamento cultural perfeito. Encaminhado para a entrevista com o Tech Lead.",
        },
        {
          vagaId: vagaDevSP.id,
          candidatoId: candThiago.id,
          etapa: "curriculo",
          resultado: "reprovado",
          motivo: "curriculo",
          parecerRhCurriculo:
            "Candidato com perfil júnior, sem a senioridade mínima de 4 anos exigida pelos critérios eliminatórios do cargo.",
        },
        {
          vagaId: vagaDevopsBH.id,
          candidatoId: candMariana.id,
          etapa: "finalizado",
          resultado: "aprovado",
          motivo: null,
          parecerRhFinalizado:
            "Processo seletivo concluído com louvor. Candidata aprovada na avaliação técnica e pelo gestor da área. Proposta formalizada e aceita.",
        },
        {
          vagaId: vagaRHPR.id,
          candidatoId: candJuliana.id,
          etapa: "entrevista_rh",
          resultado: "em_andamento",
          motivo: null,
          parecerRhCurriculo:
            "Triagem curricular positiva. Entrevista individual agendada para validação de experiências com R&S tech.",
        },
        {
          vagaId: vagaVendasSP.id,
          candidatoId: candRoberto.id,
          etapa: "finalizado",
          resultado: "aprovado",
          motivo: null,
          parecerRhFinalizado:
            "Candidato aprovado em todas as etapas e contratado para a posição de Executivo de Contas B2B.",
        },
        {
          vagaId: vagaLogRJ.id,
          candidatoId: candPatricia.id,
          etapa: "testes",
          resultado: "desistente",
          motivo: "aceitou_outra_proposta",
          parecerRhTestes:
            "Candidata informou que aceitou proposta de outra empresa antes da realização da prova técnica.",
        },
        {
          vagaId: vagaDevFloripa.id,
          candidatoId: candLucas.id,
          etapa: "curriculo",
          resultado: "banco_talentos",
          motivo: "fit_cultural",
          parecerRhCurriculo:
            "Perfil técnico excelente, porém candidato não possui interesse em modelo presencial/híbrido em Florianópolis. Mantido em banco de talentos para posições 100% remotas.",
        },
      ])
      .returning();

    if (
      !triagemLucasVaga1 ||
      !triagemThiagoVaga1 ||
      !triagemMarianaVaga2 ||
      !triagemJulianaVaga3 ||
      !triagemRobertoVaga4 ||
      !triagemPatriciaVaga5 ||
      !triagemLucasVaga6
    ) {
      throw new Error("Failed to insert triagens");
    }

    console.log("🤖 Seeding AvaliacaoIA (Presente e Ausente)...");
    // Triagens com AvaliacaoIA presente:
    // 1. triagemLucasVaga1 (Score 94.50)
    // 2. triagemThiagoVaga1 (Score 38.00 - reprovado)
    // 3. triagemMarianaVaga2 (Score 91.00 - vaga inferida)
    // 4. triagemRobertoVaga4 (Score 88.00)
    // Triagens SEM AvaliacaoIA (ausente):
    // - triagemJulianaVaga3
    // - triagemPatriciaVaga5
    // - triagemLucasVaga6
    await db.insert(avaliacaoIA).values([
      {
        triagemId: triagemLucasVaga1.id,
        vagaFoiInferida: false,
        scoreIa: "94.50",
        pontosFortes:
          "Domínio profundo de TypeScript, React/Next.js e arquitetura de microsserviços. 8 anos de experiência comprovada em projetos corporativos de grande porte.",
        requisitosFaltantes: "Nenhum requisito obrigatório faltante.",
        eliminatoriosFalhos: "Nenhum critério eliminatório violado.",
        alertas:
          "Pretensão salarial ligeiramente próxima do teto orçamentário previsto para a vaga.",
        parecerIa:
          "Candidato com perfil altamente aderente à vaga de Desenvolvedor Full Stack Sênior. Forte recomendação de continuidade no processo seletivo.",
      },
      {
        triagemId: triagemThiagoVaga1.id,
        vagaFoiInferida: false,
        scoreIa: "38.00",
        pontosFortes:
          "Conhecimento preliminar de ecossistema JavaScript e React; boa disposição para aprendizado.",
        requisitosFaltantes:
          "Falta experiência com PostgreSQL em produção, arquitetura de microsserviços e liderança técnica.",
        eliminatoriosFalhos:
          "Tempo de experiência profissional menor que 4 anos (critério eliminatório do cargo).",
        alertas: "Perfil júnior incompatível com nível sênior solicitado.",
        parecerIa:
          "Não recomendado para vaga sênior devido a critério eliminatório não atendido. Indicado para posições de nível Júnior/Trainee.",
      },
      {
        triagemId: triagemMarianaVaga2.id,
        vagaFoiInferida: true,
        scoreIa: "91.00",
        pontosFortes:
          "Sólida experiência prática em Kubernetes, Docker, Terraform e automação de pipelines CI/CD na nuvem AWS. Certificação CKA válida.",
        requisitosFaltantes:
          "Pouca vivência com observabilidade em larga escala (Prometheus/Grafana).",
        eliminatoriosFalhos: "Nenhum critério eliminatório violado.",
        alertas:
          "Necessitará de rápida ambientação com as ferramentas internas de observabilidade.",
        parecerIa:
          "Perfil altamente recomendado para a posição de Engenharia de DevOps Pleno. Vaga inferida automaticamente por proximidade de requisitos técnicos.",
      },
      {
        triagemId: triagemRobertoVaga4.id,
        vagaFoiInferida: false,
        scoreIa: "88.00",
        pontosFortes:
          "Vasta experiência em vendas corporativas B2B de software, metodologia SPIN Selling e histórico comprovado de superação de metas.",
        requisitosFaltantes: "Inglês avançado (requisito apenas desejável).",
        eliminatoriosFalhos: "Nenhum critério eliminatório violado.",
        alertas: "Disponibilidade imediata confirmada.",
        parecerIa:
          "Excelente aderência ao perfil de vendas consultivas de soluções corporativas B2B.",
      },
    ]);

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

void seed();
