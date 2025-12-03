import React, { useState, useMemo } from 'react';
import { Calculator, Leaf, TrendingDown, FileText, Download, BarChart3, Database, AlertCircle } from 'lucide-react';

// ============================================================================
// BANCO DE DADOS - Fatores de Emissão
// ============================================================================
const FATORES_EMISSAO = {
  biomassa: {
    casca_amendoim: { emissao: 0.15, mut: 0.02, densidade: 350 },
    residuo_madeira: { emissao: 0.12, mut: 0.01, densidade: 400 },
    eucalipto: { emissao: 0.18, mut: 0.05, densidade: 550 },
    pinus: { emissao: 0.16, mut: 0.04, densidade: 480 },
    bagaco_cana: { emissao: 0.10, mut: 0.00, densidade: 300 }
  },
  transporte: {
    rodoviario: { emissao: 0.062, capacidade: 30 },
    ferroviario: { emissao: 0.022, capacidade: 1000 },
    hidroviario: { emissao: 0.015, capacidade: 5000 },
    navio: { emissao: 0.012, capacidade: 50000 }
  },
  energia: {
    eletricidade_br: 0.082, // kgCO2/kWh média Brasil
    diesel: 2.68, // kgCO2/L
    gas_natural: 2.03, // kgCO2/m3
    biomassa_energia: 0.05
  },
  insumos: {
    amido_milho: 0.45,
    aditivos_quimicos: 1.2,
    agua: 0.001
  },
  combustao: {
    co2_biogenico: 1.85, // kgCO2/kg (neutro no balanço)
    nox: 0.003,
    so2: 0.001,
    mp10: 0.002
  },
  referencia_fossil: {
    carvao_mineral: 2.86, // kgCO2eq/kg
    oleo_combustivel: 3.15
  }
};

// ============================================================================
// COMPONENTES MODULARES
// ============================================================================

// Componente de Input Reutilizável
const FormInput = ({ label, value, onChange, type = "number", required = false, placeholder, unit, options }) => {
  if (options) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          required={required}
        >
          <option value="">Selecione...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};

// Componente de Card de Resultado
const ResultCard = ({ title, value, unit, color, icon: Icon }) => (
  <div className={`bg-${color}-50 p-4 rounded-lg border border-${color}-200`}>
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-gray-600">{title}</p>
      {Icon && <Icon className={`w-5 h-5 text-${color}-600`} />}
    </div>
    <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{unit}</p>
  </div>
);

// ============================================================================
// MOTOR DE CÁLCULO - Classe Calculator
// ============================================================================
class BioCalcEngine {
  constructor(dados) {
    this.dados = dados;
    this.resultados = {
      agricola: 0,
      mut: 0,
      transporte_biomassa: 0,
      industrial: 0,
      distribuicao: 0,
      uso: 0,
      total: 0,
      cbios: 0
    };
  }

  calcularFaseAgricola() {
    const { biomassaType, aproveitamento, amidoMilho } = this.dados;
    
    if (!biomassaType || !aproveitamento) return 0;

    const fatorBiomassa = FATORES_EMISSAO.biomassa[biomassaType];
    let emissao = parseFloat(aproveitamento) * fatorBiomassa.emissao;
    
    // MUT - Mudança de Uso da Terra
    this.resultados.mut = parseFloat(aproveitamento) * fatorBiomassa.mut;
    emissao += this.resultados.mut;
    
    // Insumos adicionais
    if (amidoMilho) {
      emissao += parseFloat(amidoMilho) * FATORES_EMISSAO.insumos.amido_milho;
    }
    
    this.resultados.agricola = emissao;
    return emissao;
  }

  calcularTransporteBiomassa() {
    const { distanciaTransporte, tipoVeiculo, aproveitamento } = this.dados;
    
    if (!distanciaTransporte || !tipoVeiculo || !aproveitamento) return 0;

    const fatorTransporte = FATORES_EMISSAO.transporte[tipoVeiculo];
    const emissao = (parseFloat(distanciaTransporte) * parseFloat(aproveitamento) * 
                    fatorTransporte.emissao) / fatorTransporte.capacidade;
    
    this.resultados.transporte_biomassa = emissao;
    return emissao;
  }

  calcularFaseIndustrial() {
    const { consumoEletricidade, consumoCombustivel, producaoAnual, consumoAgua } = this.dados;
    
    if (!producaoAnual || !consumoEletricidade) return 0;

    let emissao = 0;
    
    // Eletricidade
    const eletricidadePorKg = parseFloat(consumoEletricidade) / parseFloat(producaoAnual);
    emissao += eletricidadePorKg * FATORES_EMISSAO.energia.eletricidade_br;
    
    // Combustível
    if (consumoCombustivel) {
      const combustivelPorKg = parseFloat(consumoCombustivel) / parseFloat(producaoAnual);
      emissao += combustivelPorKg * FATORES_EMISSAO.energia.diesel;
    }
    
    // Água (impacto menor)
    if (consumoAgua) {
      const aguaPorKg = parseFloat(consumoAgua) / parseFloat(producaoAnual);
      emissao += aguaPorKg * FATORES_EMISSAO.insumos.agua;
    }
    
    this.resultados.industrial = emissao;
    return emissao;
  }

  calcularFaseDistribuicao() {
    const { quantidadeTransportada, distanciaDistribuicao, modalTransporte, 
            exportacao, distanciaPorto, distanciaInternacional } = this.dados;
    
    if (!quantidadeTransportada || !distanciaDistribuicao || !modalTransporte) return 0;

    let emissao = 0;
    const qtd = parseFloat(quantidadeTransportada);
    
    // Transporte doméstico
    const fatorModal = FATORES_EMISSAO.transporte[modalTransporte];
    emissao += (qtd * parseFloat(distanciaDistribuicao) * fatorModal.emissao) / 
               (fatorModal.capacidade * 1000);
    
    // Exportação
    if (exportacao && distanciaPorto && distanciaInternacional) {
      // Até o porto
      emissao += (qtd * parseFloat(distanciaPorto) * 
                 FATORES_EMISSAO.transporte.rodoviario.emissao) / 
                 (FATORES_EMISSAO.transporte.rodoviario.capacidade * 1000);
      
      // Transporte marítimo
      emissao += (qtd * parseFloat(distanciaInternacional) * 
                 FATORES_EMISSAO.transporte.navio.emissao) / 
                 (FATORES_EMISSAO.transporte.navio.capacidade * 1000);
    }
    
    this.resultados.distribuicao = emissao;
    return emissao;
  }

  calcularFaseUso() {
    const { tipoUso, eficienciaUso } = this.dados;
    
    if (!tipoUso) return 0;

    // Emissões não-CO2 na combustão (NOx, SO2, MP)
    let emissao = FATORES_EMISSAO.combustao.nox + 
                  FATORES_EMISSAO.combustao.so2 + 
                  FATORES_EMISSAO.combustao.mp10;
    
    // Ajuste por eficiência
    if (eficienciaUso) {
      const eficiencia = parseFloat(eficienciaUso) / 100;
      emissao = emissao / eficiencia;
    }
    
    // CO2 biogênico não é contabilizado (neutro)
    
    this.resultados.uso = emissao;
    return emissao;
  }

  calcularCBIOs(metodologia = 'atribucional') {
    const emissaoFossil = FATORES_EMISSAO.referencia_fossil.carvao_mineral;
    const emissaoBio = this.resultados.total;
    
    let reducao = 0;
    
    switch(metodologia) {
      case 'atribucional':
        // Método padrão IPCC
        reducao = emissaoFossil - emissaoBio;
        break;
      
      case 'cff':
        // Circular Footprint Formula (considera economia circular)
        const fatorCircular = 0.85; // 15% de crédito adicional
        reducao = (emissaoFossil - emissaoBio) * fatorCircular;
        break;
      
      case 'zero_burden':
        // Assume impacto zero para resíduos
        const fatorResiduos = 0.7; // 30% do impacto zerado
        reducao = emissaoFossil - (emissaoBio * fatorResiduos);
        break;
      
      default:
        reducao = emissaoFossil - emissaoBio;
    }
    
    // CBIOs = (redução / emissão_fossil) * volume_combustível
    // Simplificado: mostra apenas a eficiência
    this.resultados.cbios = (reducao / emissaoFossil) * 100;
    
    return this.resultados.cbios;
  }

  calcularTudo(metodologia = 'atribucional') {
    const agricola = this.calcularFaseAgricola();
    const transBiomassa = this.calcularTransporteBiomassa();
    const industrial = this.calcularFaseIndustrial();
    const distribuicao = this.calcularFaseDistribuicao();
    const uso = this.calcularFaseUso();
    
    this.resultados.total = agricola + transBiomassa + industrial + distribuicao + uso;
    this.calcularCBIOs(metodologia);
    
    return this.resultados;
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function BioCalcCompleto() {
  const [activeTab, setActiveTab] = useState('agricola');
  const [metodologiaACV, setMetodologiaACV] = useState('atribucional');
  const [results, setResults] = useState(null);

  // Estados Fase Agrícola
  const [biomassaType, setBiomassaType] = useState('');
  const [aproveitamento, setAproveitamento] = useState('');
  const [amidoMilho, setAmidoMilho] = useState('');
  const [estadoProducao, setEstadoProducao] = useState('');
  const [distanciaTransporte, setDistanciaTransporte] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');

  // Estados Fase Industrial
  const [producaoAnual, setProducaoAnual] = useState('');
  const [consumoEletricidade, setConsumoEletricidade] = useState('');
  const [consumoCombustivel, setConsumoCombustivel] = useState('');
  const [consumoAgua, setConsumoAgua] = useState('');
  const [tipoEnergia, setTipoEnergia] = useState('eletricidade_br');

  // Estados Fase Distribuição
  const [quantidadeTransportada, setQuantidadeTransportada] = useState('');
  const [distanciaDistribuicao, setDistanciaDistribuicao] = useState('');
  const [modalTransporte, setModalTransporte] = useState('');
  const [exportacao, setExportacao] = useState(false);
  const [distanciaPorto, setDistanciaPorto] = useState('');
  const [distanciaInternacional, setDistanciaInternacional] = useState('');

  // Estados Fase Uso
  const [tipoUso, setTipoUso] = useState('');
  const [eficienciaUso, setEficienciaUso] = useState('85');

  const calcular = () => {
    const dados = {
      biomassaType, aproveitamento, amidoMilho, estadoProducao,
      distanciaTransporte, tipoVeiculo, producaoAnual, consumoEletricidade,
      consumoCombustivel, consumoAgua, tipoEnergia, quantidadeTransportada,
      distanciaDistribuicao, modalTransporte, exportacao, distanciaPorto,
      distanciaInternacional, tipoUso, eficienciaUso
    };

    const calculadora = new BioCalcEngine(dados);
    const resultados = calculadora.calcularTudo(metodologiaACV);
    
    // Calcular também para outras metodologias
    const resultadosCFF = new BioCalcEngine(dados).calcularTudo('cff');
    const resultadosZero = new BioCalcEngine(dados).calcularTudo('zero_burden');
    
    setResults({
      ...resultados,
      comparacao: {
        atribucional: resultados,
        cff: resultadosCFF,
        zero_burden: resultadosZero
      }
    });
  };

  const limpar = () => {
    setBiomassaType(''); setAproveitamento(''); setAmidoMilho('');
    setEstadoProducao(''); setDistanciaTransporte(''); setTipoVeiculo('');
    setProducaoAnual(''); setConsumoEletricidade(''); setConsumoCombustivel('');
    setConsumoAgua(''); setQuantidadeTransportada(''); setDistanciaDistribuicao('');
    setModalTransporte(''); setExportacao(false); setDistanciaPorto('');
    setDistanciaInternacional(''); setTipoUso(''); setEficienciaUso('85');
    setResults(null);
  };

  const exportarRelatorio = () => {
    if (!results) return;
    
    const relatorio = {
      data: new Date().toISOString(),
      metodologia: metodologiaACV,
      resultados: results,
      dados_entrada: {
        biomassaType, aproveitamento, producaoAnual
      }
    };
    
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], 
                          { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biocalc-relatorio-${Date.now()}.json`;
    a.click();
  };

  const biomassaOptions = [
    { value: 'casca_amendoim', label: 'Casca de Amendoim' },
    { value: 'residuo_madeira', label: 'Resíduo de Madeira' },
    { value: 'eucalipto', label: 'Eucalipto' },
    { value: 'pinus', label: 'Pinus' },
    { value: 'bagaco_cana', label: 'Bagaço de Cana' }
  ];

  const estadosOptions = [
    { value: 'SP', label: 'São Paulo' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PR', label: 'Paraná' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'GO', label: 'Goiás' }
  ];

  const transporteOptions = [
    { value: 'rodoviario', label: 'Rodoviário (caminhão)' },
    { value: 'ferroviario', label: 'Ferroviário (trem)' },
    { value: 'hidroviario', label: 'Hidroviário (balsa)' }
  ];

  const usoOptions = [
    { value: 'caldeira_industrial', label: 'Caldeira Industrial' },
    { value: 'termoeletrica', label: 'Usina Termelétrica' },
    { value: 'aquecimento_comercial', label: 'Aquecimento Comercial' }
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
                <p className="text-sm text-gray-600">Sistema Completo de Avaliação de Ciclo de Vida</p>
              </div>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Seleção de Metodologia ACV */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Metodologia de ACV
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'atribucional', label: 'ACV Atribucional (IPCC)', desc: 'Método padrão' },
              { value: 'cff', label: 'Circular Footprint Formula', desc: 'Economia circular' },
              { value: 'zero_burden', label: 'Zero-Burden', desc: 'Resíduos = impacto zero' }
            ].map(met => (
              <button
                key={met.value}
                onClick={() => setMetodologiaACV(met.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  metodologiaACV === met.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <p className="font-medium text-gray-800">{met.label}</p>
                <p className="text-xs text-gray-600 mt-1">{met.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { id: 'agricola', label: '1. Agrícola' },
              { id: 'industrial', label: '2. Industrial' },
              { id: 'distribuicao', label: '3. Distribuição' },
              { id: 'uso', label: '4. Uso Final' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Fase Agrícola */}
            {activeTab === 'agricola' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Fase Agrícola e Transporte da Biomassa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Tipo de Biomassa"
                    value={biomassaType}
                    onChange={setBiomassaType}
                    options={biomassaOptions}
                    required
                  />
                  <FormInput
                    label="Estado de Produção"
                    value={estadoProducao}
                    onChange={setEstadoProducao}
                    options={estadosOptions}
                    required
                  />
                  <FormInput
                    label="Aproveitamento da Biomassa"
                    value={aproveitamento}
                    onChange={setAproveitamento}
                    unit="kg biomassa/kg biocombustível"
                    placeholder="Ex: 1.2"
                    required
                  />
                  <FormInput
                    label="Amido de Milho (opcional)"
                    value={amidoMilho}
                    onChange={setAmidoMilho}
                    unit="kg/kg biomassa"
                    placeholder="Ex: 0.05"
                  />
                  <FormInput
                    label="Distância de Transporte"
                    value={distanciaTransporte}
                    onChange={setDistanciaTransporte}
                    unit="km"
                    placeholder="Ex: 150"
                    required
                  />
                  <FormInput
                    label="Tipo de Veículo"
                    value={tipoVeiculo}
                    onChange={setTipoVeiculo}
                    options={transporteOptions}
                    required
                  />
                </div>
              </div>
            )}

            {/* Fase Industrial */}
            {activeTab === 'industrial' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Fase Industrial (Processamento)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Produção Anual"
                    value={producaoAnual}
                    onChange={setProducaoAnual}
                    unit="kg/ano"
                    placeholder="Ex: 1000000"
                    required
                  />
                  <FormInput
                    label="Consumo de Eletricidade"
                    value={consumoEletricidade}
                    onChange={setConsumoEletricidade}
                    unit="kWh/ano"
                    placeholder="Ex: 500000"
                    required
                  />
                  <FormInput
                    label="Consumo de Combustível (Diesel)"
                    value={consumoCombustivel}
                    onChange={setConsumoCombustivel}
                    unit="L/ano"
                    placeholder="Ex: 50000"
                  />
                  <FormInput
                    label="Consumo de Água"
                    value={consumoAgua}
                    onChange={setConsumoAgua}
                    unit="L/ano"
                    placeholder="Ex: 10000"
                  />
                </div>
              </div>
            )}

            {/* Fase Distribuição */}
            {activeTab === 'distribuicao' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Fase de Distribuição
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Quantidade Transportada"
                    value={quantidadeTransportada}
                    onChange={setQuantidadeTransportada}
                    unit="kg/ano"
                    placeholder="Ex: 800000"
                    required
                  />
                  <FormInput
                    label="Distância até Mercado"
                    value={distanciaDistribuicao}
                    onChange={setDistanciaDistribuicao}
                    unit="km"
                    placeholder="Ex: 500"
                    required
                  />
                  <FormInput
                    label="Modal de Transporte"
                    value={modalTransporte}
                    onChange={setModalTransporte}
                    options={transporteOptions}
                    required
                  />
                  
                  <div className="mb-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportacao}
                        onChange={(e) => setExportacao(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Incluir Exportação Internacional
                      </span>
                    </label>
                  </div>

                  {exportacao && (
                    <>
                      <FormInput
                        label="Distância até Porto"
                        value={distanciaPorto}
                        onChange={setDistanciaPorto}
                        unit="km"
                        placeholder="Ex: 200"
                      />
                      <FormInput
                        label="Distância Marítima Internacional"
                        value={distanciaInternacional}
                        onChange={setDistanciaInternacional}
                        unit="km"
                        placeholder="Ex: 8000"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Fase Uso */}
            {activeTab === 'uso' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Fase de Uso Final
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Tipo de Uso"
                    value={tipoUso}
                    onChange={setTipoUso}
                    options={usoOptions}
                    required
                  />
                  <FormInput
                    label="Eficiência de Combustão"
                    value={eficienciaUso}
                    onChange={setEficienciaUso}
                    unit="%"
                    placeholder="Ex: 85"
                  />
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Nota:</strong> O CO₂ biogênico não é contabilizado no balanço total, 
                    pois é considerado neutro (ciclo curto de carbono). Apenas emissões de NOx, 
                    SO₂ e material particulado são incluídas.
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
            Calcular Pegada de Carbono
          </button>
          <button
            onClick={limpar}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-4 px-6 rounded-lg transition-colors"
          >
            Limpar
          </button>
          {results && (
            <button
              onClick={exportarRelatorio}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar
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
                <h2 className="text-2xl font-bold text-gray-800">Resultados da Análise</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Fase Agrícola</p>
                  <p className="text-2xl font-bold text-blue-700">{results.agricola.toFixed(3)}</p>
                  <p className="text-xs text-gray-500 mt-1">kgCO₂eq/kg</p>
                  <p className="text-xs text-gray-600 mt-2">MUT: {results.mut.toFixed(3)}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Transporte Biomassa</p>
                  <p className="text-2xl font-bold text-purple-700">{results.transporte_biomassa.toFixed(3)}</p>
                  <p className="text-xs text-gray-500 mt-1">kgCO₂eq/kg</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Fase Industrial</p>
                  <p className="text-2xl font-bold text-orange-700">{results.industrial.toFixed(3)}</p>
                  <p className="text-xs text-gray-500 mt-1">kgCO₂eq/kg</p>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <p className="text-sm text-gray-600 mb-1">Distribuição</p>
                  <p className="text-2xl font-bold text-pink-700">{results.distribuicao.toFixed(3)}</p>
                  <p className="text-xs text-gray-500 mt-1">kgCO₂eq/kg</p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <p className="text-sm text-gray-600 mb-1">Uso Final</p>
                  <p className="text-2xl font-bold text-indigo-700">{results.uso.toFixed(3)}</p>
                  <p className="text-xs text-gray-500 mt-1">kgCO₂eq/kg</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                  <p className="text-sm opacity-90 mb-1">Emissão Total</p>
                  <p className="text-4xl font-bold">{results.total.toFixed(3)}</p>
                  <p className="text-xs opacity-80 mt-1">kgCO₂eq/kg biocombustível</p>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                  <p className="text-sm opacity-90 mb-1">Eficiência Energético-Ambiental</p>
                  <p className="text-4xl font-bold">{results.cbios.toFixed(1)}%</p>
                  <p className="text-xs opacity-80 mt-1">Redução vs. Carvão Mineral</p>
                </div>
              </div>
            </div>

            {/* Comparação de Metodologias */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Comparação de Metodologias ACV</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries({
                  atribucional: { label: 'ACV Atribucional', color: 'blue' },
                  cff: { label: 'Circular Footprint', color: 'green' },
                  zero_burden: { label: 'Zero-Burden', color: 'purple' }
                }).map(([key, info]) => {
                  const res = results.comparacao[key];
                  return (
                    <div key={key} className={`bg-${info.color}-50 p-4 rounded-lg border-2 ${
                      metodologiaACV === key ? `border-${info.color}-500` : 'border-transparent'
                    }`}>
                      <p className="font-medium text-gray-800 mb-2">{info.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{res.total.toFixed(3)}</p>
                      <p className="text-xs text-gray-600 mb-2">kgCO₂eq/kg</p>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-700">
                          Crédito: <span className="font-bold">{res.cbios.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico Visual Simplificado */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Distribuição das Emissões</h3>
              <div className="space-y-3">
                {[
                  { label: 'Agrícola + MUT', value: results.agricola, color: 'blue' },
                  { label: 'Transporte Biomassa', value: results.transporte_biomassa, color: 'purple' },
                  { label: 'Industrial', value: results.industrial, color: 'orange' },
                  { label: 'Distribuição', value: results.distribuicao, color: 'pink' },
                  { label: 'Uso Final', value: results.uso, color: 'indigo' }
                ].map(item => {
                  const percentage = (item.value / results.total) * 100;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-medium text-gray-900">
                          {item.value.toFixed(3)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`bg-${item.color}-500 h-3 rounded-full transition-all duration-500`}
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
                    <li>Resultados baseados em fatores de emissão simplificados</li>
                    <li>Para certificação oficial, utilize dados primários validados</li>
                    <li>Considere realizar análise de sensibilidade para parâmetros críticos</li>
                    <li>Recomenda-se revisão por terceira parte para uso comercial</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 bg-white rounded-lg p-4">
          <p className="font-medium">BioCalc - Sistema Completo de ACV para Biocombustíveis Sólidos</p>
          <p className="mt-1">Projeto CNPq 401237/2022-2 | Desenvolvido para Computação e Sustentabilidade</p>
          <p className="mt-2 text-xs">
            Contato: engs@ufscar.br | Versão MVP 1.0
          </p>
        </div>
      </div>
    </div>
  );
}