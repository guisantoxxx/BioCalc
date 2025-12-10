import React, { useState } from 'react';
import { Calculator, Leaf, TrendingDown, FileText, Download, BarChart3, Database, AlertCircle, Truck, Factory, Package, Flame } from 'lucide-react';

// ============================================================================
// BANCO DE DADOS ATUALIZADO - Extraído do CSV fornecido
// ============================================================================
const FATORES_EMISSAO = {
  // FASE AGRÍCOLA - Valores CORRETOS do CSV
  biomassa: {
    casca_amendoim: { 
      emissao: 0.153, // kg CO₂eq/kg - do CSV: Casca de Amendoin (1,53E-01)
      mut: 0.000162, // Será sobrescrito pela tabela MUT
      poder_calorifico: 17.1, // MJ/kg - do CSV: Pellet/Briquette de Casca de Amendoin
      densidade: 350 
    },
    residuo_madeira: { 
      // PARA RESÍDUO DE PINUS do CSV:
      emissao: 0.0251, // kg CO₂eq/kg - Resíduo de Pinus (2,51E-02)
      mut: 0, // Será sobrescrito pela tabela MUT
      poder_calorifico: 18.8, // MJ/kg - Pellet/Briquette Pinus
      densidade: 400 
    },
    eucalipto: { 
      // PARA RESÍDUO DE EUCALIPTUS do CSV:
      emissao: 0.0251, // kg CO₂eq/kg - Resíduo de Eucaliptus (2,51E-02)
      mut: 0, // Será sobrescrito pela tabela MUT
      poder_calorifico: 15.8, // MJ/kg - Pellet/Briquette Eucaliptus
      densidade: 550 
    },
    pinus: { 
      // PARA PINUS VIRGEM do CSV:
      emissao: 0.422, // kg CO₂eq/kg - Pinus Virgem (4,22E-01)
      mut: 0, // Será sobrescrito pela tabela MUT
      poder_calorifico: 18.8, // MJ/kg - Pellet/Briquette de Pinus Virgem
      densidade: 480 
    },
    carvao_eucalipto: { // ADICIONADO do CSV
      emissao: 1.76, // kg CO₂eq/kg - Carvão vegetal de eucalipto (1,76E+00)
      mut: 0, // Não aplica (não tem MUT)
      poder_calorifico: 18.5, // MJ/kg - Carvão vegetal de Eucalipto
      densidade: 650 
    },
    eucaliptus_virgem: { // ADICIONADO do CSV
      emissao: 0.104, // kg CO₂eq/kg - Eucaliptus Virgem (1,04E-01)
      mut: 0, // Será sobrescrito pela tabela MUT
      poder_calorifico: 15.8, // MJ/kg - Pellet/Briquette de Eucaliptus Virgem
      densidade: 500 
    }
  },
  
  // FASE TRANSPORTE BIOMASSA - Valores CORRETOS do CSV
  transporte_biomassa: {
    caminhao_pequeno: { 
      emissao: 0.0937, // kg CO₂eq/t.km - Transporte, caminhão 7.5-16t (9,37E-02)
      capacidade: 15 
    },
    caminhao_medio: { 
      emissao: 0.0980, // kg CO₂eq/t.km - Transporte caminhão 16-32t (9,80E-02)
      capacidade: 25 
    },
    caminhao_grande: { 
      emissao: 0.0611, // kg CO₂eq/t.km - Transporte, caminhão >32t (6,11E-02)
      capacidade: 35 
    }
  },
  
  // FASE INDUSTRIAL - ELETRICIDADE (kg CO₂eq/kWh) - Valores CORRETOS do CSV
  eletricidade: {
    rede_media_voltagem: 0.502, // Eletricidade da rede - mix média voltagem (5,02E-01)
    rede_alta_voltagem: 0.129, // Eletricidade da rede - mix alta voltagem (1,29E-01)
    pch: 0.0367, // Eletricidade - PCH (3,67E-02)
    biomassa: 0.110, // Eletricidade - biomassa (1,10E-01)
    eolica: 0.000138, // Eletricidade - eólica (1,38E-04)
    solar: 0.0801 // Eletricidade - solar (8,01E-02)
  },
  
  // FASE INDUSTRIAL - COMBUSTÍVEIS (PRODUÇÃO + COMBUSTÃO) - Valores CORRETOS do CSV
  combustiveis: {
    diesel: {
      producao: 0.796, // kg CO₂eq/L - Diesel produção (7,96E-01)
      combustao: 2.64  // kg CO₂eq/L - Combustão de Diesel (2,64E+00)
    },
    gas_natural: {
      producao: 0.335, // kg CO₂eq/Nm³ - Gás Natural produção (3,35E-01)
      combustao: 1.53  // kg CO₂eq/Nm³ - Uso de Gás Natural (1,53E+00)
    },
    glp: {
      producao: 0.722, // kg CO₂eq/kg - GLP produção (7,22E-01)
      combustao: 2.93  // kg CO₂eq/kg - Uso de GLP (2,93E+00)
    },
    gasolina_a: {
      producao: 1.31, // kg CO₂eq/L - Gasolina A produção (1,31E+00)
      combustao: 2.25  // kg CO₂eq/L - Combustão de Gasolina A (2,25E+00)
    },
    etanol_anidro: {
      producao: 1.23, // kg CO₂eq/L - Etanol anidro produção (1,23E+00)
      combustao: 1.79  // kg CO₂eq/L - Combustão de Etanol anidro (1,79E+00)
    },
    etanol_hidratado: {
      producao: 0.607, // kg CO₂eq/L - Etanol hidratado produção (6,07E-01)
      combustao: 1.70   // kg CO₂eq/L - Combustão de Etanol hidratado (1,70E+00)
    },
    cavaco_madeira: {
      producao: 0.365, // kg CO₂eq/kg - Cavaco de madeira produção (3,65E-01)
      combustao: 1.97  // kg CO₂eq/kg - Combustão de Cavaco de madeira (1,97E+00)
    },
    lenha: {
      producao: 0.0260, // kg CO₂eq/kg - Lenha produção (2,60E-02)
      combustao: 1.97  // kg CO₂eq/kg - Combustão de Lenha (1,97E+00)
    }
  },
  
  // FASE INDUSTRIAL - INSUMOS - Valores CORRETOS do CSV
  insumos: {
    amido_milho: 1.20, // kg CO₂eq/kg - Amido de milho (1,20E+00)
    agua: 0.0000237, // kg CO₂eq/L - Água (2,37E-05)
    oleo_lubrificante: 1.51, // kg CO₂eq/kg - Óleo lubrificante (1,51E+00)
    areia_silica: 0.0358 // kg CO₂eq/kg - Areia de sílica (3,58E-02)
  },
  
  // FASE DISTRIBUIÇÃO - Valores CORRETOS do CSV
  distribuicao: {
    ferroviario: 0.0334, // kg CO₂eq/t.km - Transporte, ferroviário (3,34E-02)
    balsa: 0.0350, // kg CO₂eq/t.km - Transporte, balsa (3,50E-02)
    navio: 0.00952 // kg CO₂eq/t.km - Transporte, navio (9,52E-03)
  },
  
  // COMBUSTÃO DE BIOMASSA (FASE USO) - Valores CORRETOS do CSV
  combustao_biomassa: {
    casca_amendoim: 1.74, // kg CO₂eq/kg - Casca de Amendoin (1,74E+00)
    residuo_madeira: 1.97, // kg CO₂eq/kg - Resíduo de Pinus (1,97E+00)
    eucalipto: 1.97, // kg CO₂eq/kg - Resíduo de Eucaliptus (1,97E+00)
    pinus: 1.97, // kg CO₂eq/kg - Pinus Virgem (1,97E+00)
    carvao_eucalipto: 1.88, // kg CO₂eq/kg - Carvão vegetal de eucalipto (1,88E+00)
    eucaliptus_virgem: 1.97 // kg CO₂eq/kg - Eucaliptus Virgem (1,97E+00)
  },
  
  // COMBUSTÃO ESTACIONÁRIA (FASE USO) - kg CO₂eq/MJ - Valores do CSV
  combustao_estacionaria: {
    casca_amendoim: 0.000373, // kg CO₂eq/MJ - Casca de Amendoin
    residuo_madeira: 0.000369, // kg CO₂eq/MJ - Resíduo de Pinus
    eucalipto: 0.000369, // kg CO₂eq/MJ - Resíduo de Eucaliptus
    pinus: 0.000369, // kg CO₂eq/MJ - Pinus Virgem
    carvao_eucalipto: 0.119052, // kg CO₂eq/MJ - Carvão vegetal de eucalipto
    eucaliptus_virgem: 0.000369 // kg CO₂eq/MJ - Eucaliptus Virgem
  },
  
  // FATORES GWP - Valores CORRETOS do CSV
  gwp_factors: {
    co2_fossil: 1.0, // kg CO₂eq/kg - CO2 - Dióxido de Carbono Fóssil
    ch4_fossil: 29.8, // kg CO₂eq/kg - CH4 - Metano Fóssil
    ch4_biogenic: 27.2, // kg CO₂eq/kg - CH4 - biogênico - Metano Biogênico
    n2o: 273.0 // kg CO₂eq/kg - N2O - Óxido Nitroso
  },
  
  // REFERÊNCIAS FÓSSEIS - Valores CORRETOS do CSV
  referencia_fossil: {
    media_ponderada: 0.0867, // kg CO₂eq/MJ - Média ponderada: Diesel A, Gasolina A e GNV
    gasolina_a: 0.0874, // kg CO₂eq/MJ - Gasolina A
    diesel_a: 0.0865, // kg CO₂eq/MJ - Diesel A
    oleo_combustivel: 0.094, // kg CO₂eq/MJ - Óleo Combustível
    coque_petroleo: 0.120, // kg CO₂eq/MJ - Coque de Petróleo
    querosene_aviacao: 0.0875, // kg CO₂eq/MJ - Querosene de aviação
    glp: 0.0850 // kg CO₂eq/MJ - GLP
  }
};

// ============================================================================
// DADOS COMPLETOS DE MUDANÇA DE USO DA TERRA POR ESTADO - EXTRAÍDOS DO CSV
// ============================================================================
const MUT_POR_ESTADO = {
  'Acre': {
    casca_amendoim: 0.000162,
    eucalipto: 0,
    pinus: 0,
    residuo_madeira: 0,
    carvao_eucalipto: 0,
    eucaliptus_virgem: 0
  },
  'Alagoas': {
    casca_amendoim: 0,
    eucalipto: 0,
    pinus: 0,
    residuo_madeira: 0,
    carvao_eucalipto: 0,
    eucaliptus_virgem: 0
  },
  'Amapá': {
    casca_amendoim: 0.000100,
    eucalipto: 0.002620,
    pinus: 0.007720,
    residuo_madeira: 0.007720,
    carvao_eucalipto: 0.002620,
    eucaliptus_virgem: 0.002620
  },
  'Amazonas': {
    casca_amendoim: 0,
    eucalipto: 0,
    pinus: 0,
    residuo_madeira: 0,
    carvao_eucalipto: 0,
    eucaliptus_virgem: 0
  },
  'Bahia': {
    casca_amendoim: 0,
    eucalipto: -0.000200,
    pinus: -0.000590,
    residuo_madeira: -0.000590,
    carvao_eucalipto: -0.000200,
    eucaliptus_virgem: -0.000200
  },
  'Ceará': {
    casca_amendoim: 0.000195,
    eucalipto: 0,
    pinus: 0,
    residuo_madeira: 0,
    carvao_eucalipto: 0,
    eucaliptus_virgem: 0
  },
  'Distrito Federal': {
    casca_amendoim: 0.000149,
    eucalipto: -0.000404,
    pinus: -0.001190,
    residuo_madeira: -0.001190,
    carvao_eucalipto: -0.000404,
    eucaliptus_virgem: -0.000404
  },
  'Espírito Santo': {
    casca_amendoim: 0,
    eucalipto: -0.000115,
    pinus: -0.000340,
    residuo_madeira: -0.000340,
    carvao_eucalipto: -0.000115,
    eucaliptus_virgem: -0.000115
  },
  'Goiás': {
    casca_amendoim: 0.000401,
    eucalipto: -0.000709,
    pinus: -0.002090,
    residuo_madeira: -0.002090,
    carvao_eucalipto: -0.000709,
    eucaliptus_virgem: -0.000709
  },
  'Maranhão': {
    casca_amendoim: 0,
    eucalipto: 0.002960,
    pinus: 0.008730,
    residuo_madeira: 0.008730,
    carvao_eucalipto: 0.002960,
    eucaliptus_virgem: 0.002960
  },
  'Mato Grosso': {
    casca_amendoim: 0.000926,
    eucalipto: -0.000777,
    pinus: -0.002290,
    residuo_madeira: -0.002290,
    carvao_eucalipto: -0.000777,
    eucaliptus_virgem: -0.000777
  },
  'Mato Grosso do Sul': {
    casca_amendoim: 0.000243,
    eucalipto: -0.000899,
    pinus: -0.002650,
    residuo_madeira: -0.002650,
    carvao_eucalipto: -0.000899,
    eucaliptus_virgem: -0.000899
  },
  'Minas Gerais': {
    casca_amendoim: 0.000142,
    eucalipto: 0.000129,
    pinus: 0.000380,
    residuo_madeira: 0.000380,
    carvao_eucalipto: 0.000129,
    eucaliptus_virgem: 0.000129
  },
  'Pará': {
    casca_amendoim: 0.000171,
    eucalipto: 0.004150,
    pinus: 0.012200,
    residuo_madeira: 0.012200,
    carvao_eucalipto: 0.004150,
    eucaliptus_virgem: 0.004150
  },
  'Paraíba': {
    casca_amendoim: 0.001590,
    eucalipto: -0.001500,
    pinus: -0.004430,
    residuo_madeira: -0.004430,
    carvao_eucalipto: -0.001500,
    eucaliptus_virgem: -0.001500
  },
  'Paraná': {
    casca_amendoim: 0.0000687,
    eucalipto: 0.00000339,
    pinus: 0.0000100,
    residuo_madeira: 0.0000100,
    carvao_eucalipto: 0.00000339,
    eucaliptus_virgem: 0.00000339
  },
  'Pernambuco': {
    casca_amendoim: 0.000130,
    eucalipto: -0.001380,
    pinus: -0.004060,
    residuo_madeira: -0.004060,
    carvao_eucalipto: -0.001380,
    eucaliptus_virgem: -0.001380
  },
  'Piauí': {
    casca_amendoim: 0.0000458,
    eucalipto: -0.000492,
    pinus: -0.001450,
    residuo_madeira: -0.001450,
    carvao_eucalipto: -0.000492,
    eucaliptus_virgem: -0.000492
  },
  'Rio de Janeiro': {
    casca_amendoim: 0.000152,
    eucalipto: 0.001290,
    pinus: 0.003790,
    residuo_madeira: 0.003790,
    carvao_eucalipto: 0.001290,
    eucaliptus_virgem: 0.001290
  },
  'Rio Grande do Norte': {
    casca_amendoim: 0,
    eucalipto: 0,
    pinus: 0,
    residuo_madeira: 0,
    carvao_eucalipto: 0,
    eucaliptus_virgem: 0
  },
  'Rio Grande do Sul': {
    casca_amendoim: 0,
    eucalipto: 0.000170,
    pinus: 0.000500,
    residuo_madeira: 0.000500,
    carvao_eucalipto: 0.000170,
    eucaliptus_virgem: 0.000170
  },
  'Rondônia': {
    casca_amendoim: 0.000156,
    eucalipto: 0.005360,
    pinus: 0.015800,
    residuo_madeira: 0.015800,
    carvao_eucalipto: 0.005360,
    eucaliptus_virgem: 0.005360
  },
  'Roraima': {
    casca_amendoim: 0.000581,
    eucalipto: 0.003790,
    pinus: 0.011200,
    residuo_madeira: 0.011200,
    carvao_eucalipto: 0.003790,
    eucaliptus_virgem: 0.003790
  },
  'Santa Catarina': {
    casca_amendoim: 0,
    eucalipto: 0.000499,
    pinus: 0.001470,
    residuo_madeira: 0.001470,
    carvao_eucalipto: 0.000499,
    eucaliptus_virgem: 0.000499
  },
  'São Paulo': {
    casca_amendoim: 0.000141,
    eucalipto: -0.000163,
    pinus: -0.000480,
    residuo_madeira: -0.000480,
    carvao_eucalipto: -0.000163,
    eucaliptus_virgem: -0.000163
  },
  'Sergipe': {
    casca_amendoim: 0.000174,
    eucalipto: -0.001050,
    pinus: -0.003090,
    residuo_madeira: -0.003090,
    carvao_eucalipto: -0.001050,
    eucaliptus_virgem: -0.001050
  },
  'Tocantins': {
    casca_amendoim: 0.000200,
    eucalipto: 0.003110,
    pinus: 0.009160,
    residuo_madeira: 0.009160,
    carvao_eucalipto: 0.003110,
    eucaliptus_virgem: 0.003110
  },
  'Brasil': {
    casca_amendoim: 0.000303,
    eucalipto: 0.0000238,
    pinus: 0.0000700,
    residuo_madeira: 0.0000700,
    carvao_eucalipto: 0.0000238,
    eucaliptus_virgem: 0.0000238
  }
};

// ============================================================================
// COMPONENTES MODULARES
// ============================================================================
const FormInput = ({ label, value, onChange, type = "number", required = false, placeholder, unit, options, helpText }) => {
  const safeValue = value || '';
  
  if (options) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          required={required}
        >
          <option value="">Selecione...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
        {unit && <span className="text-gray-500 text-xs ml-1">({unit})</span>}
      </label>
      <input
        type={type}
        step={type === "number" ? "0.001" : undefined}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        placeholder={placeholder}
        required={required}
      />
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
};

const ResultCard = ({ title, value, unit, color, icon: Icon, subtitle }) => (
  <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {Icon && <Icon className={`w-5 h-5 text-${color}-600`} />}
    </div>
    <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{unit}</p>
  </div>
);

// ============================================================================
// MOTOR DE CÁLCULO ATUALIZADO
// ============================================================================
class BioCalcEngineAtualizado {
  constructor(dados) {
    this.dados = dados;
    this.poderCalorifico = FATORES_EMISSAO.biomassa[dados.biomassaType]?.poder_calorifico || 18;
    this.resultados = {
      fase_agricola: 0,
      mut: 0,
      transporte_biomassa: 0,
      fase_industrial: 0,
      eletricidade: 0,
      combustiveis: 0,
      cogeração: 0,
      insumos: 0,
      distribuicao: 0,
      uso: 0,
      total: 0,
      eficiencia_ambiental: 0,
      cbios: 0
    };
  }

  // MÉTODO PARA OBTER MUT COM BASE NO ESTADO
  getMUTValue(biomassaType, estadoProducao) {
    if (!biomassaType || !estadoProducao) return 0;
    
    const estadoData = MUT_POR_ESTADO[estadoProducao];
    if (!estadoData) return 0;
    
    // A chave no objeto MUT_POR_ESTADO é a mesma que o tipo de biomassa
    return estadoData[biomassaType] || 0;
  }

  // MÉTODO PARA OBTER FATOR DE COMBUSTÃO
  getFatorCombustao(biomassaType) {
    return FATORES_EMISSAO.combustao_biomassa[biomassaType] || 0;
  }

  calcularFaseAgricola() {
    const { biomassaType, fatorEspecifico = 1, amidoMilho = 0 } = this.dados;
    
    if (!biomassaType) return 0;

    const fatorBiomassa = FATORES_EMISSAO.biomassa[biomassaType];
    if (!fatorBiomassa) return 0;

    let impacto = fatorBiomassa.emissao * this.poderCalorifico * parseFloat(fatorEspecifico);
    
    if (amidoMilho) {
      const impactoMilho = parseFloat(amidoMilho) * FATORES_EMISSAO.insumos.amido_milho * this.poderCalorifico;
      impacto += impactoMilho;
    }
    
    this.resultados.fase_agricola = impacto;
    return impacto;
  }

  calcularMUT() {
    const { biomassaType, percentualAlocacao = 100, estadoProducao } = this.dados;
    
    if (!biomassaType || !estadoProducao) return 0;

    const mutValue = this.getMUTValue(biomassaType, estadoProducao);
    const mut = mutValue * (parseFloat(percentualAlocacao) / 100) * this.poderCalorifico;
    
    this.resultados.mut = mut;
    return mut;
  }

  calcularTransporteBiomassa() {
    const { distanciaTransporte, tipoVeiculo, quantidadeBiomassa } = this.dados;
    
    if (!distanciaTransporte || !tipoVeiculo || !quantidadeBiomassa) return 0;

    const fatorTransporte = FATORES_EMISSAO.transporte_biomassa[tipoVeiculo];
    if (!fatorTransporte) return 0;

    const quantidadeTon = parseFloat(quantidadeBiomassa) / 1000;
    const impacto = fatorTransporte.emissao * (quantidadeTon * parseFloat(distanciaTransporte));
    const impactoPorMJ = impacto / (parseFloat(quantidadeBiomassa) * this.poderCalorifico);
    
    this.resultados.transporte_biomassa = impactoPorMJ;
    return impactoPorMJ;
  }

  calcularFaseIndustrial() {
    const eletricidade = this.calcularEletricidade();
    const combustiveis = this.calcularCombustiveis();
    const cogeração = this.calcularCogeração();
    const insumos = this.calcularInsumos();
    
    const total = eletricidade + combustiveis + cogeração + insumos;
    this.resultados.fase_industrial = total;
    
    return total;
  }

  calcularEletricidade() {
    const { consumoEletricidade, producaoAnual, tipoEletricidade = 'rede_media_voltagem' } = this.dados;
    
    if (!consumoEletricidade || !producaoAnual) return 0;

    const fatorEletricidade = FATORES_EMISSAO.eletricidade[tipoEletricidade] || 0.502;
    const impactoAnual = parseFloat(consumoEletricidade) * fatorEletricidade;
    const impactoPorMJ = impactoAnual * (1 / parseFloat(producaoAnual)) * this.poderCalorifico;
    
    this.resultados.eletricidade = impactoPorMJ;
    return impactoPorMJ;
  }

  calcularCombustiveis() {
    const { consumoDiesel = 0, consumoGasNatural = 0, producaoAnual } = this.dados;
    
    if (!producaoAnual) return 0;

    let impactoTotal = 0;
    
    if (consumoDiesel) {
      const diesel = parseFloat(consumoDiesel);
      const impactoDiesel = diesel * (FATORES_EMISSAO.combustiveis.diesel.producao + 
                                     FATORES_EMISSAO.combustiveis.diesel.combustao);
      impactoTotal += impactoDiesel;
    }
    
    if (consumoGasNatural) {
      const gas = parseFloat(consumoGasNatural);
      const impactoGas = gas * (FATORES_EMISSAO.combustiveis.gas_natural.producao + 
                               FATORES_EMISSAO.combustiveis.gas_natural.combustao);
      impactoTotal += impactoGas;
    }
    
    const impactoPorMJ = impactoTotal * (1 / parseFloat(producaoAnual)) * this.poderCalorifico;
    
    this.resultados.combustiveis = impactoPorMJ;
    return impactoPorMJ;
  }

  calcularCogeração() {
    const { biomassaQueimada, producaoAnual } = this.dados;
    
    if (!biomassaQueimada || !producaoAnual) return 0;

    const fatorCombustao = this.getFatorCombustao(this.dados.biomassaType);
    if (!fatorCombustao) return 0;

    const impactoAnual = parseFloat(biomassaQueimada) * fatorCombustao;
    const impactoPorMJ = impactoAnual * (1 / parseFloat(producaoAnual)) * this.poderCalorifico;
    
    this.resultados.cogeração = impactoPorMJ;
    return impactoPorMJ;
  }

  calcularInsumos() {
    const { consumoAgua = 0, consumoOleo = 0, consumoAreia = 0, producaoAnual } = this.dados;
    
    if (!producaoAnual) return 0;

    let impactoTotal = 0;
    
    if (consumoAgua) {
      impactoTotal += parseFloat(consumoAgua) * FATORES_EMISSAO.insumos.agua;
    }
    
    if (consumoOleo) {
      impactoTotal += parseFloat(consumoOleo) * FATORES_EMISSAO.insumos.oleo_lubrificante;
    }
    
    if (consumoAreia) {
      impactoTotal += parseFloat(consumoAreia) * FATORES_EMISSAO.insumos.areia_silica;
    }
    
    const impactoPorMJ = impactoTotal * (1 / parseFloat(producaoAnual)) * this.poderCalorifico;
    
    this.resultados.insumos = impactoPorMJ;
    return impactoPorMJ;
  }

  calcularFaseDistribuicao() {
    const mercadoDomestico = this.calcularDistribuicaoMercadoDomestico();
    const exportacao = this.calcularDistribuicaoExportacao();
    
    const total = mercadoDomestico + exportacao;
    this.resultados.distribuicao = total;
    
    return total;
  }

  calcularDistribuicaoMercadoDomestico() {
    const { quantidadeTransportada, distanciaDistribuicao, 
            percentualFerroviario = 0, percentualHidroviario = 0,
            tipoVeiculoRodoviario } = this.dados;
    
    if (!quantidadeTransportada || !distanciaDistribuicao) return 0;

    const quantidadeTon = parseFloat(quantidadeTransportada);
    const distancia = parseFloat(distanciaDistribuicao);
    
    let impactoTotal = 0;
    
    if (percentualFerroviario) {
      const percentual = parseFloat(percentualFerroviario) / 100;
      impactoTotal += quantidadeTon * distancia * percentual * FATORES_EMISSAO.distribuicao.ferroviario;
    }
    
    if (percentualHidroviario) {
      const percentual = parseFloat(percentualHidroviario) / 100;
      impactoTotal += quantidadeTon * distancia * percentual * FATORES_EMISSAO.distribuicao.balsa;
    }
    
    const percentualRodoviario = 1 - (parseFloat(percentualFerroviario || 0) / 100 + 
                                      parseFloat(percentualHidroviario || 0) / 100);
    if (percentualRodoviario > 0) {
      const fatorVeiculo = FATORES_EMISSAO.transporte_biomassa[tipoVeiculoRodoviario]?.emissao || 0.098;
      impactoTotal += quantidadeTon * distancia * percentualRodoviario * fatorVeiculo;
    }
    
    const mjTransportado = quantidadeTon * 1000 * (1 / this.poderCalorifico);
    const impactoPorMJ = mjTransportado > 0 ? impactoTotal / mjTransportado : 0;
    
    return impactoPorMJ;
  }

  calcularDistribuicaoExportacao() {
    const { exportacaoQuantidade, distanciaFabricaPorto, distanciaPortoMercado,
            tipoVeiculoPorto, percentualFerroviarioPorto = 0, percentualHidroviarioPorto = 0 } = this.dados;
    
    if (!exportacaoQuantidade) return 0;

    const quantidadeTon = parseFloat(exportacaoQuantidade);
    let impactoTotal = 0;
    
    if (distanciaFabricaPorto) {
      const distancia = parseFloat(distanciaFabricaPorto);
      const percentualRodoviarioPorto = 1 - (parseFloat(percentualFerroviarioPorto || 0) / 100 + 
                                             parseFloat(percentualHidroviarioPorto || 0) / 100);
      
      if (percentualRodoviarioPorto > 0) {
        const fatorVeiculo = FATORES_EMISSAO.transporte_biomassa[tipoVeiculoPorto]?.emissao || 0.098;
        impactoTotal += quantidadeTon * distancia * percentualRodoviarioPorto * fatorVeiculo;
      }
      
      if (percentualFerroviarioPorto) {
        const percentual = parseFloat(percentualFerroviarioPorto) / 100;
        impactoTotal += quantidadeTon * distancia * percentual * FATORES_EMISSAO.distribuicao.ferroviario;
      }
      
      if (percentualHidroviarioPorto) {
        const percentual = parseFloat(percentualHidroviarioPorto) / 100;
        impactoTotal += quantidadeTon * distancia * percentual * FATORES_EMISSAO.distribuicao.balsa;
      }
    }
    
    if (distanciaPortoMercado) {
      const distancia = parseFloat(distanciaPortoMercado);
      impactoTotal += quantidadeTon * distancia * FATORES_EMISSAO.distribuicao.navio;
    }
    
    const mjExportado = quantidadeTon * 1000 * (1 / this.poderCalorifico);
    const impactoPorMJ = mjExportado > 0 ? impactoTotal / mjExportado : 0;
    
    return impactoPorMJ;
  }

  calcularFaseUso() {
    const { eficienciaUso = 85 } = this.dados;
    
    // Usar fator de combustão estacionária do CSV (kg CO₂eq/MJ)
    const fatorCombustaoEstacionaria = FATORES_EMISSAO.combustao_estacionaria[this.dados.biomassaType] || 0;
    
    // Ajustar pela eficiência de combustão
    const eficiencia = parseFloat(eficienciaUso) / 100;
    const impacto = eficiencia > 0 ? fatorCombustaoEstacionaria / eficiencia : 0;
    
    this.resultados.uso = impacto;
    return impacto;
  }

  calcularTotal() {
    const agricola = this.resultados.fase_agricola;
    const mut = this.resultados.mut;
    const transporteBiomassa = this.resultados.transporte_biomassa;
    const industrial = this.resultados.fase_industrial;
    const distribuicao = this.resultados.distribuicao;
    const uso = this.resultados.uso;
    
    this.resultados.total = agricola + mut + transporteBiomassa + industrial + distribuicao + uso;
    
    return this.resultados.total;
  }

  calcularEficienciaAmbiental() {
    const total = this.resultados.total;
    const referencia = FATORES_EMISSAO.referencia_fossil.media_ponderada;
    
    const eficiencia = ((referencia - total) / referencia) * 100;
    this.resultados.eficiencia_ambiental = eficiencia;
    
    return eficiencia;
  }

  calcularCBIOs() {
    const { producaoAnual } = this.dados;
    const eficiencia = this.resultados.eficiencia_ambiental;
    
    if (eficiencia <= 0 || !producaoAnual) {
      this.resultados.cbios = 0;
      return 0;
    }
    
    const notaEficiencia = FATORES_EMISSAO.referencia_fossil.media_ponderada - this.resultados.total;
    const volumeTon = parseFloat(producaoAnual) / 1000;
    const cbios = Math.floor(this.poderCalorifico * volumeTon * notaEficiencia);
    
    this.resultados.cbios = cbios;
    return cbios;
  }

  calcularTudo() {
    this.calcularFaseAgricola();
    this.calcularMUT();
    this.calcularTransporteBiomassa();
    this.calcularFaseIndustrial();
    this.calcularFaseDistribuicao();
    this.calcularFaseUso();
    this.calcularTotal();
    this.calcularEficienciaAmbiental();
    this.calcularCBIOs();
    
    return this.resultados;
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function BioCalcAtualizado() {
  const [activeTab, setActiveTab] = useState('agricola');
  const [results, setResults] = useState(null);
  const [tipoUso, setTipoUso] = useState('');

  // Estados Fase Agrícola
  const [biomassaType, setBiomassaType] = useState('');
  const [fatorEspecifico, setFatorEspecifico] = useState('1');
  const [amidoMilho, setAmidoMilho] = useState('');
  const [percentualAlocacao, setPercentualAlocacao] = useState('100');
  const [estadoProducao, setEstadoProducao] = useState('');
  const [distanciaTransporte, setDistanciaTransporte] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [quantidadeBiomassa, setQuantidadeBiomassa] = useState('');

  // Estados Fase Industrial
  const [producaoAnual, setProducaoAnual] = useState('');
  const [consumoEletricidade, setConsumoEletricidade] = useState('');
  const [tipoEletricidade, setTipoEletricidade] = useState('rede_media_voltagem');
  const [consumoDiesel, setConsumoDiesel] = useState('');
  const [consumoGasNatural, setConsumoGasNatural] = useState('');
  const [biomassaQueimada, setBiomassaQueimada] = useState('');
  const [consumoAgua, setConsumoAgua] = useState('');
  const [consumoOleo, setConsumoOleo] = useState('');
  const [consumoAreia, setConsumoAreia] = useState('');

  // Estados Fase Distribuição
  const [quantidadeTransportada, setQuantidadeTransportada] = useState('');
  const [distanciaDistribuicao, setDistanciaDistribuicao] = useState('');
  const [percentualFerroviario, setPercentualFerroviario] = useState('');
  const [percentualHidroviario, setPercentualHidroviario] = useState('');
  const [tipoVeiculoRodoviario, setTipoVeiculoRodoviario] = useState('');
  const [exportacaoQuantidade, setExportacaoQuantidade] = useState('');
  const [distanciaFabricaPorto, setDistanciaFabricaPorto] = useState('');
  const [distanciaPortoMercado, setDistanciaPortoMercado] = useState('');
  const [tipoVeiculoPorto, setTipoVeiculoPorto] = useState('');
  const [percentualFerroviarioPorto, setPercentualFerroviarioPorto] = useState('');
  const [percentualHidroviarioPorto, setPercentualHidroviarioPorto] = useState('');

  // Estados Fase Uso
  const [eficienciaUso, setEficienciaUso] = useState('85');

  const calcular = () => {
    const dados = {
      biomassaType,
      fatorEspecifico,
      amidoMilho,
      percentualAlocacao,
      estadoProducao,
      distanciaTransporte,
      tipoVeiculo,
      quantidadeBiomassa,
      producaoAnual,
      consumoEletricidade,
      tipoEletricidade,
      consumoDiesel,
      consumoGasNatural,
      biomassaQueimada,
      consumoAgua,
      consumoOleo,
      consumoAreia,
      quantidadeTransportada,
      distanciaDistribuicao,
      percentualFerroviario,
      percentualHidroviario,
      tipoVeiculoRodoviario,
      exportacaoQuantidade,
      distanciaFabricaPorto,
      distanciaPortoMercado,
      tipoVeiculoPorto,
      percentualFerroviarioPorto,
      percentualHidroviarioPorto,
      eficienciaUso
    };

    const calculadora = new BioCalcEngineAtualizado(dados);
    const resultados = calculadora.calcularTudo();
    
    setResults(resultados);
  };

  const limpar = () => {
    setBiomassaType(''); setFatorEspecifico('1'); setAmidoMilho('');
    setPercentualAlocacao('100'); setEstadoProducao(''); setDistanciaTransporte('');
    setTipoVeiculo(''); setQuantidadeBiomassa(''); setProducaoAnual('');
    setConsumoEletricidade(''); setTipoEletricidade('rede_media_voltagem');
    setConsumoDiesel(''); setConsumoGasNatural(''); setBiomassaQueimada('');
    setConsumoAgua(''); setConsumoOleo(''); setConsumoAreia('');
    setQuantidadeTransportada(''); setDistanciaDistribuicao('');
    setPercentualFerroviario(''); setPercentualHidroviario('');
    setTipoVeiculoRodoviario(''); setExportacaoQuantidade('');
    setDistanciaFabricaPorto(''); setDistanciaPortoMercado('');
    setTipoVeiculoPorto(''); setPercentualFerroviarioPorto('');
    setPercentualHidroviarioPorto(''); setEficienciaUso('85');
    setResults(null);
  };

  const exportarRelatorio = () => {
    if (!results) return;
    
    const relatorio = {
      data: new Date().toISOString(),
      resultados: results,
      dados_entrada: {
        biomassaType,
        fatorEspecifico,
        producaoAnual,
        poderCalorifico: FATORES_EMISSAO.biomassa[biomassaType]?.poder_calorifico || 18
      },
      fonte_dados: 'Extraído do arquivo CSV fornecido'
    };
    
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], 
                          { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biocalc-relatorio-${Date.now()}.json`;
    a.click();
  };

  // Opções para os formulários
  const biomassaOptions = [
    { value: 'casca_amendoim', label: 'Casca de Amendoim' },
    { value: 'residuo_madeira', label: 'Resíduo de Madeira (Pinus)' },
    { value: 'eucalipto', label: 'Eucalipto (Resíduo)' },
    { value: 'pinus', label: 'Pinus Virgem' },
    { value: 'carvao_eucalipto', label: 'Carvão Vegetal de Eucalipto' },
    { value: 'eucaliptus_virgem', label: 'Eucaliptus Virgem' }
  ];

  const estadosOptions = [
    { value: 'Acre', label: 'Acre' },
    { value: 'Alagoas', label: 'Alagoas' },
    { value: 'Amapá', label: 'Amapá' },
    { value: 'Amazonas', label: 'Amazonas' },
    { value: 'Bahia', label: 'Bahia' },
    { value: 'Ceará', label: 'Ceará' },
    { value: 'Distrito Federal', label: 'Distrito Federal' },
    { value: 'Espírito Santo', label: 'Espírito Santo' },
    { value: 'Goiás', label: 'Goiás' },
    { value: 'Maranhão', label: 'Maranhão' },
    { value: 'Mato Grosso', label: 'Mato Grosso' },
    { value: 'Mato Grosso do Sul', label: 'Mato Grosso do Sul' },
    { value: 'Minas Gerais', label: 'Minas Gerais' },
    { value: 'Pará', label: 'Pará' },
    { value: 'Paraíba', label: 'Paraíba' },
    { value: 'Paraná', label: 'Paraná' },
    { value: 'Pernambuco', label: 'Pernambuco' },
    { value: 'Piauí', label: 'Piauí' },
    { value: 'Rio de Janeiro', label: 'Rio de Janeiro' },
    { value: 'Rio Grande do Norte', label: 'Rio Grande do Norte' },
    { value: 'Rio Grande do Sul', label: 'Rio Grande do Sul' },
    { value: 'Rondônia', label: 'Rondônia' },
    { value: 'Roraima', label: 'Roraima' },
    { value: 'Santa Catarina', label: 'Santa Catarina' },
    { value: 'São Paulo', label: 'São Paulo' },
    { value: 'Sergipe', label: 'Sergipe' },
    { value: 'Tocantins', label: 'Tocantins' },
    { value: 'Brasil', label: 'Brasil (média)' }
  ];

  const transporteOptions = [
    { value: 'caminhao_pequeno', label: 'Caminhão Pequeno (15t)' },
    { value: 'caminhao_medio', label: 'Caminhão Médio (25t)' },
    { value: 'caminhao_grande', label: 'Caminhão Grande (35t)' }
  ];

  const eletricidadeOptions = [
    { value: 'rede_media_voltagem', label: 'Rede Média Voltagem' },
    { value: 'rede_alta_voltagem', label: 'Rede Alta Voltagem' },
    { value: 'pch', label: 'Pequena Central Hidrelétrica (PCH)' },
    { value: 'biomassa', label: 'Biomassa' },
    { value: 'eolica', label: 'Eólica' },
    { value: 'solar', label: 'Solar' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="w-10 h-10 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">BioCalc</h1>
                <p className="text-sm text-gray-600">Sistema Completo de ACV para Biocombustíveis</p>
                <div className="flex items-center gap-2 mt-1">
                  <Database className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-green-600">Dados extraídos do arquivo CSV fornecido</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Truck className="w-8 h-8 text-blue-500" />
              <Factory className="w-8 h-8 text-orange-500" />
              <Package className="w-8 h-8 text-purple-500" />
              <Flame className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { id: 'agricola', label: '1. Agrícola', icon: Leaf },
              { id: 'industrial', label: '2. Industrial', icon: Factory },
              { id: 'distribuicao', label: '3. Distribuição', icon: Truck },
              { id: 'uso', label: '4. Uso Final', icon: Flame }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-4 font-medium transition-all flex flex-col items-center gap-1 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Fase Agrícola */}
            {activeTab === 'agricola' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">Fase Agrícola e Transporte da Biomassa</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Tipo de Biomassa"
                    value={biomassaType}
                    onChange={setBiomassaType}
                    options={biomassaOptions}
                    required
                    helpText="Selecione a biomassa utilizada"
                  />
                  <FormInput
                    label="Estado de Produção"
                    value={estadoProducao}
                    onChange={setEstadoProducao}
                    options={estadosOptions}
                    required
                    helpText="Estado onde a biomassa foi produzida"
                  />
                  <FormInput
                    label="Fator Específico"
                    value={fatorEspecifico}
                    onChange={setFatorEspecifico}
                    unit="kg biomassa/kg biocombustível"
                    placeholder="1"
                    helpText="Padrão: 1 (use se tiver dado específico)"
                  />
                  <FormInput
                    label="Amido de Milho (opcional)"
                    value={amidoMilho}
                    onChange={setAmidoMilho}
                    unit="kg/MJ"
                    placeholder="0.05"
                    helpText="Entrada de amido de milho por MJ de biocombustível"
                  />
                  <FormInput
                    label="Percentual de Alocação para MUT"
                    value={percentualAlocacao}
                    onChange={setPercentualAlocacao}
                    unit="%"
                    placeholder="100"
                    helpText="% da biomassa considerada na Mudança de Uso da Terra"
                  />
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Transporte da Biomassa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormInput
                        label="Distância de Transporte"
                        value={distanciaTransporte}
                        onChange={setDistanciaTransporte}
                        unit="km"
                        placeholder="150"
                        required
                      />
                      <FormInput
                        label="Tipo de Veículo"
                        value={tipoVeiculo}
                        onChange={setTipoVeiculo}
                        options={transporteOptions}
                        required
                      />
                      <FormInput
                        label="Quantidade de Biomassa"
                        value={quantidadeBiomassa}
                        onChange={setQuantidadeBiomassa}
                        unit="kg"
                        placeholder="1000000"
                        helpText="Quantidade transportada anualmente"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fase Industrial */}
            {activeTab === 'industrial' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Factory className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-800">Fase Industrial (Processamento)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Produção Anual de Biocombustível"
                    value={producaoAnual}
                    onChange={setProducaoAnual}
                    unit="kg/ano"
                    placeholder="1000000"
                    required
                  />
                  
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Energia Elétrica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Consumo de Eletricidade"
                        value={consumoEletricidade}
                        onChange={setConsumoEletricidade}
                        unit="kWh/ano"
                        placeholder="500000"
                        required
                      />
                      <FormInput
                        label="Tipo de Eletricidade"
                        value={tipoEletricidade}
                        onChange={setTipoEletricidade}
                        options={eletricidadeOptions}
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Combustíveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Consumo de Diesel"
                        value={consumoDiesel}
                        onChange={setConsumoDiesel}
                        unit="L/ano"
                        placeholder="50000"
                      />
                      <FormInput
                        label="Consumo de Gás Natural"
                        value={consumoGasNatural}
                        onChange={setConsumoGasNatural}
                        unit="Nm³/ano"
                        placeholder="10000"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Co-geração</h3>
                    <FormInput
                      label="Biomassa Consumida na Co-geração"
                      value={biomassaQueimada}
                      onChange={setBiomassaQueimada}
                      unit="kg/ano"
                      placeholder="200000"
                      helpText="Quantidade da mesma biomassa usada para geração de energia"
                    />
                  </div>
                  
                  <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Insumos Industriais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormInput
                        label="Consumo de Água"
                        value={consumoAgua}
                        onChange={setConsumoAgua}
                        unit="L/ano"
                        placeholder="10000"
                      />
                      <FormInput
                        label="Consumo de Óleo Lubrificante"
                        value={consumoOleo}
                        onChange={setConsumoOleo}
                        unit="kg/ano"
                        placeholder="500"
                      />
                      <FormInput
                        label="Consumo de Areia de Sílica"
                        value={consumoAreia}
                        onChange={setConsumoAreia}
                        unit="kg/ano"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fase Distribuição */}
            {activeTab === 'distribuicao' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">Fase de Distribuição</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">Mercado Doméstico</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Quantidade Transportada"
                        value={quantidadeTransportada}
                        onChange={setQuantidadeTransportada}
                        unit="toneladas"
                        placeholder="800"
                      />
                      <FormInput
                        label="Distância até Mercado"
                        value={distanciaDistribuicao}
                        onChange={setDistanciaDistribuicao}
                        unit="km"
                        placeholder="500"
                      />
                      <FormInput
                        label="% Ferroviário"
                        value={percentualFerroviario}
                        onChange={setPercentualFerroviario}
                        unit="%"
                        placeholder="30"
                        helpText="Percentual do trajeto por via ferroviária"
                      />
                      <FormInput
                        label="% Hidroviário"
                        value={percentualHidroviario}
                        onChange={setPercentualHidroviario}
                        unit="%"
                        placeholder="20"
                        helpText="Percentual do trajeto por via hidroviária"
                      />
                      <FormInput
                        label="Tipo de Veículo Rodoviário"
                        value={tipoVeiculoRodoviario}
                        onChange={setTipoVeiculoRodoviario}
                        options={transporteOptions}
                        helpText="Para o percentual rodoviário"
                      />
                      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Rodoviário:</strong> {100 - (parseFloat(percentualFerroviario || 0) + parseFloat(percentualHidroviario || 0))}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">Exportação (opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Quantidade para Exportação"
                        value={exportacaoQuantidade}
                        onChange={setExportacaoQuantidade}
                        unit="toneladas"
                        placeholder="200"
                      />
                      <FormInput
                        label="Distância da Fábrica ao Porto"
                        value={distanciaFabricaPorto}
                        onChange={setDistanciaFabricaPorto}
                        unit="km"
                        placeholder="200"
                      />
                      <FormInput
                        label="Tipo de Veículo até o Porto"
                        value={tipoVeiculoPorto}
                        onChange={setTipoVeiculoPorto}
                        options={transporteOptions}
                      />
                      <FormInput
                        label="Distância Porto-Mercado Final"
                        value={distanciaPortoMercado}
                        onChange={setDistanciaPortoMercado}
                        unit="km"
                        placeholder="8000"
                      />
                      <FormInput
                        label="% Ferroviário até Porto"
                        value={percentualFerroviarioPorto}
                        onChange={setPercentualFerroviarioPorto}
                        unit="%"
                        placeholder="40"
                      />
                      <FormInput
                        label="% Hidroviário até Porto"
                        value={percentualHidroviarioPorto}
                        onChange={setPercentualHidroviarioPorto}
                        unit="%"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fase Uso */}
            {activeTab === 'uso' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-800">Fase de Uso Final</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Tipo de Uso"
                    value={tipoUso}
                    onChange={setTipoUso}
                    options={[
                      { value: 'caldeira_industrial', label: 'Caldeira Industrial' },
                      { value: 'termoeletrica', label: 'Usina Termelétrica' },
                      { value: 'aquecimento_comercial', label: 'Aquecimento Comercial' }
                    ]}
                  />
                  <FormInput
                    label="Eficiência de Combustão"
                    value={eficienciaUso}
                    onChange={setEficienciaUso}
                    unit="%"
                    placeholder="85"
                  />
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Nota:</strong> A fase de uso considera apenas emissões não-CO₂ (NOx, SO₂ e material particulado).
                    O CO₂ biogênico é considerado neutro no balanço de carbono.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={calcular}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Calculator className="w-5 h-5" />
            Calcular ACV Completo
          </button>
          <button
            onClick={limpar}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            Limpar Todos os Dados
          </button>
          {results && (
            <button
              onClick={exportarRelatorio}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar Relatório
            </button>
          )}
        </div>

        {/* Resultados */}
        {results && (
          <div className="space-y-6">
            {/* Resumo Principal */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingDown className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Resultados da Análise de Ciclo de Vida</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <ResultCard
                  title="Emissão Total"
                  value={results.total.toFixed(4)}
                  unit="kg CO₂eq/MJ"
                  color="green"
                  icon={Leaf}
                  subtitle="Intensidade de carbono total"
                />
                
                <ResultCard
                  title="Eficiência Energético-Ambiental"
                  value={`${results.eficiencia_ambiental.toFixed(1)}%`}
                  unit="vs. fóssil substituto"
                  color="blue"
                  icon={TrendingDown}
                  subtitle="Redução de emissões"
                />
                
                <ResultCard
                  title="CBIOs Elegíveis"
                  value={results.cbios.toLocaleString()}
                  unit="créditos para 10.000 ton"
                  color="purple"
                  icon={FileText}
                  subtitle="Considerando produção anual"
                />
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-4">Detalhamento por Fase</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Fase Agrícola</p>
                  <p className="text-2xl font-bold text-blue-700">{results.fase_agricola.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg CO₂eq/MJ</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">MUT</p>
                  <p className="text-2xl font-bold text-green-700">{results.mut.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg CO₂eq/MJ</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Transporte Biomassa</p>
                  <p className="text-2xl font-bold text-purple-700">{results.transporte_biomassa.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg CO₂eq/MJ</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Fase Industrial</p>
                  <p className="text-2xl font-bold text-orange-700">{results.fase_industrial.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg CO₂eq/MJ</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Fase Distribuição</p>
                  <p className="text-2xl font-bold text-red-700">{results.distribuicao.toFixed(4)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg CO₂eq/MJ</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Detalhamento da Fase Industrial</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eletricidade:</span>
                      <span className="font-medium">{results.eletricidade.toFixed(4)} kg CO₂eq/MJ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Combustíveis:</span>
                      <span className="font-medium">{results.combustiveis.toFixed(4)} kg CO₂eq/MJ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Co-geração:</span>
                      <span className="font-medium">{results.cogeração.toFixed(4)} kg CO₂eq/MJ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Insumos:</span>
                      <span className="font-medium">{results.insumos.toFixed(4)} kg CO₂eq/MJ</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Comparação com Fóssil</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Biocombustível:</span>
                      <span className="font-medium">{results.total.toFixed(4)} kg CO₂eq/MJ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fóssil (média):</span>
                      <span className="font-medium">{FATORES_EMISSAO.referencia_fossil.media_ponderada.toFixed(4)} kg CO₂eq/MJ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Nota de Eficiência:</span>
                      <span className="font-medium text-green-600">
                        {(FATORES_EMISSAO.referencia_fossil.media_ponderada - results.total).toFixed(4)} kg CO₂eq/MJ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Distribuição */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Distribuição das Emissões</h3>
              <div className="space-y-4">
                {[
                  { label: 'Fase Agrícola', value: results.fase_agricola, color: 'bg-blue-500' },
                  { label: 'MUT', value: results.mut, color: 'bg-green-500' },
                  { label: 'Transporte Biomassa', value: results.transporte_biomassa, color: 'bg-purple-500' },
                  { label: 'Fase Industrial', value: results.fase_industrial, color: 'bg-orange-500' },
                  { label: 'Fase Distribuição', value: results.distribuicao, color: 'bg-red-500' },
                  { label: 'Fase Uso', value: results.uso, color: 'bg-indigo-500' }
                ].map(item => {
                  const percentage = results.total > 0 ? (item.value / results.total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-medium text-gray-900">
                          {item.value.toFixed(4)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${item.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Avisos e Recomendações */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Notas Importantes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Todos os dados de emissão foram extraídos do arquivo CSV fornecido</li>
                    <li>Os valores de MUT variam por estado - selecione o estado correto</li>
                    <li>Para certificação oficial, utilize dados primários validados</li>
                    <li>Os cálculos seguem as fórmulas técnicas estabelecidas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 bg-white rounded-lg p-4">
          <p className="font-medium">BioCalc - Sistema Completo de ACV para Biocombustíveis Sólidos</p>
          <p className="mt-1">Dados extraídos de: arquivo CSV fornecido</p>
          <p className="mt-2 text-xs">
            Fórmulas aplicadas: Produção de Biomassa, MUT, Transporte, Industrial, Distribuição, Uso
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Database className="w-4 h-4 text-green-500" />
            <p className="text-xs text-green-600">Dados atualizados conforme CSV</p>
          </div>
        </div>
      </div>
    </div>
  );
}