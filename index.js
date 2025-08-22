const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Configurações básicas
const SENHA_ADMIN = "8801";
const ARQUIVO_LICENCAS = path.join(__dirname, 'licencas.json');

// Para processar dados JSON
app.use(express.json());

// 🔧 FUNÇÃO PARA SALVAR LICENÇAS NO ARQUIVO
function salvarLicencas() {
  try {
    fs.writeFileSync(ARQUIVO_LICENCAS, JSON.stringify(licencas, null, 2));
    console.log('💾 Licenças salvas no arquivo!');
  } catch (error) {
    console.error('❌ Erro ao salvar licenças:', error);
  }
}

// 🔧 FUNÇÃO PARA CARREGAR LICENÇAS DO ARQUIVO
function carregarLicencas() {
  try {
    if (fs.existsSync(ARQUIVO_LICENCAS)) {
      const dados = fs.readFileSync(ARQUIVO_LICENCAS, 'utf8');
      const licencasCarregadas = JSON.parse(dados);

      // Converter datas de string para Date
      Object.keys(licencasCarregadas).forEach(chave => {
        if (licencasCarregadas[chave].criadaEm) {
          licencasCarregadas[chave].criadaEm = new Date(licencasCarregadas[chave].criadaEm);
        }
        if (licencasCarregadas[chave].expiraEm) {
          licencasCarregadas[chave].expiraEm = new Date(licencasCarregadas[chave].expiraEm);
        }
        if (licencasCarregadas[chave].primeiroUso) {
          licencasCarregadas[chave].primeiroUso = new Date(licencasCarregadas[chave].primeiroUso);
        }
        if (licencasCarregadas[chave].ultimoAcesso) {
          licencasCarregadas[chave].ultimoAcesso = new Date(licencasCarregadas[chave].ultimoAcesso);
        }
      });

      console.log(`✅ ${Object.keys(licencasCarregadas).length} licenças carregadas do arquivo!`);
      return licencasCarregadas;
    } else {
      console.log('📝 Arquivo de licenças não existe, criando com licença padrão...');
      return {
        "ABC123-XYZ789": {
          conta: null,
          ativa: true,
          criadaEm: new Date(),
          expiraEm: new Date('2025-12-31')
        }
      };
    }
  } catch (error) {
    console.error('❌ Erro ao carregar licenças:', error);
    console.log('🔄 Usando licença padrão...');
    return {
      "ABC123-XYZ789": {
        conta: null,
        ativa: true,
        criadaEm: new Date(),
        expiraEm: new Date('2025-12-31')
      }
    };
  }
}

// 🚀 CARREGAR LICENÇAS NA INICIALIZAÇÃO
let licencas = carregarLicencas();

// 💾 SALVAR LICENÇAS AUTOMATICAMENTE A CADA 30 SEGUNDOS
setInterval(() => {
  salvarLicencas();
}, 30000);

// ROTA PRINCIPAL - Para o EA verificar a licença
app.get('/verificar', (req, res) => {
  const chave = req.query.chave;
  const conta = req.query.conta;

  console.log(`Verificação: Chave=${chave}, Conta=${conta}`);

  if (!chave || !conta) {
    console.log('❌ Parâmetros faltando');
    return res.send('Parâmetros inválidos');
  }

  if (!licencas[chave]) {
    console.log('❌ Licença não encontrada');
    return res.send('Licença não encontrada');
  }

  const licenca = licencas[chave];

  if (!licenca.ativa) {
    console.log('❌ Licença desativada');
    return res.send('Licença desativada');
  }

  if (new Date() > licenca.expiraEm) {
    console.log('❌ Licença expirada');
    return res.send('Licença expirada');
  }

  if (!licenca.conta) {
    // Se tem conta especificada na criação, verificar se é a mesma
    if (conta) {
      licenca.conta = parseInt(conta);
      licenca.primeiroUso = new Date();
      console.log(`✅ Conta ${conta} associada à licença ${chave}`);
      // 💾 Salvar imediatamente após associar conta
      salvarLicencas();
    }
  }
  else if (licenca.conta !== parseInt(conta)) {
    console.log('❌ Conta diferente da registrada');
    return res.send('Esta licença está registrada para outra conta');
  }

  licenca.ultimoAcesso = new Date();
  console.log('✅ Licença aprovada!');

  // 💾 Salvar último acesso (sem bloquear a resposta)
  setTimeout(() => {
    salvarLicencas();
  }, 100);

  res.send('APROVADO');
});

// Página inicial com painel COMPLETO
app.get('/', (req, res) => {
  const serverUrl = req.get('host');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sistema de Licenças EA MT5</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1000px; 
                margin: 50px auto; 
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container { 
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; text-align: center; }
            .section { 
                margin: 20px 0; 
                padding: 20px; 
                border: 2px solid #ddd; 
                border-radius: 8px;
                background-color: #fafafa;
            }
            input, button { 
                padding: 10px; 
                margin: 5px; 
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            }
            button { 
                background-color: #007cba; 
                color: white; 
                border: none; 
                cursor: pointer;
                min-width: 120px;
            }
            button:hover { background-color: #005a87; }
            .btn-danger { background-color: #dc3545; }
            .btn-danger:hover { background-color: #c82333; }
            .btn-warning { background-color: #ffc107; color: #212529; }
            .btn-warning:hover { background-color: #e0a800; }
            .btn-success { background-color: #28a745; }
            .btn-success:hover { background-color: #218838; }
            .resultado { 
                margin-top: 15px; 
                padding: 15px; 
                border-radius: 5px;
                font-weight: bold;
            }
            .sucesso { background-color: #d4edda; color: #155724; }
            .erro { background-color: #f8d7da; color: #721c24; }
            pre { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 5px;
                overflow-x: auto;
                font-size: 12px;
            }
            .license-item {
                background: #e9ecef;
                margin: 10px 0;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #007cba;
                position: relative;
            }
            .license-active { border-left-color: #28a745; }
            .license-inactive { border-left-color: #dc3545; }
            .license-expired { border-left-color: #ffc107; }
            .conta-badge {
                position: absolute;
                right: 10px;
                top: 10px;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                color: white;
            }
            .conta-ativa { background-color: #28a745; }
            .conta-inativa { background-color: #6c757d; }
            .persistent-badge {
                background: linear-gradient(45deg, #28a745, #20c997);
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
                margin: 10px 0;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 Sistema de Licenças EA MT5 - PAINEL COMPLETO</h1>
            <div class="persistent-badge">💾 SISTEMA PERSISTENTE - Licenças nunca se perdem!</div>

            <div class="section">
                <h2>🧪 Testar Licença</h2>
                <p>Use esta seção para testar se uma licença está funcionando:</p>
                <input type="text" id="chaveTest" placeholder="Digite a chave (ex: ABC123-XYZ789)" style="width: 250px;">
                <input type="number" id="contaTest" placeholder="Número da conta MT5" style="width: 200px;">
                <br>
                <button onclick="testarLicenca()">🔍 Verificar Licença</button>
                <div id="resultadoTest"></div>
            </div>

            <div class="section">
                <h2>➕ Criar Nova Licença</h2>
                <input type="password" id="senhaAdmin" placeholder="Senha de administrador" style="width: 200px;">
                <input type="number" id="diasValidade" placeholder="Dias de validade" value="30" style="width: 150px;">
                <input type="number" id="contaMT5" placeholder="Conta MT5 (opcional)" style="width: 200px;">
                <br>
                <button onclick="criarLicenca()">🎫 Criar Licença</button>
                <div id="resultadoAdmin"></div>
            </div>

            <div class="section">
                <h2>📋 Gerenciar Licenças</h2>
                <input type="password" id="senhaGerenciar" placeholder="Senha de administrador" style="width: 200px;" value="8801">
                <button onclick="listarLicencas()">📜 Listar Todas</button>
                <button onclick="atualizarLista()">🔄 Atualizar</button>
                <div id="resultadoLista"></div>
            </div>

            <div class="section">
                <h2>🗑️ Ações Rápidas</h2>
                <input type="password" id="senhaAcao" placeholder="Senha admin" style="width: 150px;">
                <input type="text" id="chaveAcao" placeholder="Chave da licença" style="width: 200px;">
                <br>
                <button class="btn-danger" onclick="deletarLicenca()">🗑️ Deletar</button>
                <button class="btn-warning" onclick="desativarLicenca()">❌ Desativar</button>
                <button class="btn-success" onclick="ativarLicenca()">✅ Ativar</button>
                <div id="resultadoAcao"></div>
            </div>

            <div class="section">
                <h2>📋 Como usar no seu EA</h2>
                <pre>
// URL do seu servidor
string ServerURL = "${serverUrl}";

// Sua chave de licença
input string ChaveLicenca = "";

bool VerificarLicenca()
{
    string url = ServerURL + "/verificar?chave=" + ChaveLicenca + "&conta=" + IntegerToString(AccountNumber());
    string resultado = "";
    char dados[];
    string headers = "";

    int resposta = WebRequest("GET", url, headers, 5000, dados, resultado, headers);

    if(resposta == -1)
    {
        Print("Erro na conexão com servidor de licenças");
        return false;
    }

    Print("Resposta do servidor: ", resultado);

    if(StringFind(resultado, "APROVADO") >= 0)
    {
        return true;
    }
    else
    {
        Alert("Licença inválida: " + resultado);
        return false;
    }
}
                </pre>
            </div>

            <div class="section">
                <h2>ℹ️ Informações do Sistema</h2>
                <p><strong>URL deste servidor:</strong> <span style="background: #e9ecef; padding: 5px; border-radius: 3px; font-family: monospace;">${serverUrl}</span></p>
                <p><strong>Licenças cadastradas:</strong> ${Object.keys(licencas).length}</p>
                <p><strong>Status:</strong> <span style="color: green;">🟢 Online</span></p>
                <p><strong>Persistência:</strong> <span style="color: green;">💾 Ativa - Salvo em licencas.json</span></p>
                <p><strong>Última atualização:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
        </div>

        <script>
            async function testarLicenca() {
                const chave = document.getElementById('chaveTest').value;
                const conta = document.getElementById('contaTest').value;
                const resultado = document.getElementById('resultadoTest');

                if (!chave || !conta) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Preencha a chave e o número da conta!</div>';
                    return;
                }

                try {
                    const response = await fetch('/verificar?chave=' + chave + '&conta=' + conta);
                    const text = await response.text();

                    if (text === 'APROVADO') {
                        resultado.innerHTML = '<div class="resultado sucesso">✅ LICENÇA VÁLIDA!</div>';
                    } else {
                        resultado.innerHTML = '<div class="resultado erro">❌ ' + text + '</div>';
                    }
                } catch (error) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Erro de conexão</div>';
                }
            }

            async function criarLicenca() {
                const senha = document.getElementById('senhaAdmin').value;
                const dias = document.getElementById('diasValidade').value;
                const contaMT5 = document.getElementById('contaMT5').value;
                const resultado = document.getElementById('resultadoAdmin');

                if (!senha) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Digite a senha de administrador!</div>';
                    return;
                }

                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let chave = '';
                for (let i = 0; i < 6; i++) {
                    chave += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                chave += '-';
                for (let i = 0; i < 6; i++) {
                    chave += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                try {
                    const response = await fetch('/admin/criar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ senha, chave, dias, contaMT5: contaMT5 || null })
                    });

                    const data = await response.json();

                    if (data.sucesso) {
                        let contaInfo = contaMT5 ? '<br><strong>Conta MT5:</strong> ' + contaMT5 : '<br><strong>Conta:</strong> Será associada no primeiro uso';
                        resultado.innerHTML = '<div class="resultado sucesso">✅ Nova licença criada e SALVA permanentemente!<br><strong>Chave:</strong> ' + data.chave + '<br><strong>Válida até:</strong> ' + new Date(data.expiraEm).toLocaleDateString('pt-BR') + contaInfo + '</div>';

                        document.getElementById('senhaAdmin').value = '';
                        document.getElementById('diasValidade').value = '30';
                        document.getElementById('contaMT5').value = '';

                        const senhaGerenciar = document.getElementById('senhaGerenciar').value;
                        if (senhaGerenciar === '8801') {
                            listarLicencas();
                        }
                    } else {
                        resultado.innerHTML = '<div class="resultado erro">❌ ' + data.erro + '</div>';
                    }
                } catch (error) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Erro ao criar licença</div>';
                }
            }

            async function listarLicencas() {
                const senha = document.getElementById('senhaGerenciar').value;
                const resultado = document.getElementById('resultadoLista');

                if (!senha) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Digite a senha!</div>';
                    return;
                }

                try {
                    const response = await fetch('/admin/listar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ senha })
                    });

                    const data = await response.json();

                    if (data.sucesso) {
                        let html = '<h3>📋 Lista de Licenças (Salvas Permanentemente):</h3>';
                        data.licencas.forEach(lic => {
                            const status = lic.expirada ? 'license-expired' : lic.ativa ? 'license-active' : 'license-inactive';
                            const statusText = lic.expirada ? '⏰ EXPIRADA' : lic.ativa ? '✅ ATIVA' : '❌ INATIVA';
                            const contaDisplay = lic.conta ? '🏦 ' + lic.conta : '⚪ Não associada';
                            const contaClass = lic.conta ? 'conta-ativa' : 'conta-inativa';

                            html += '<div class="license-item ' + status + '">';
                            html += '<div class="conta-badge ' + contaClass + '">' + contaDisplay + '</div>';
                            html += '<strong>' + lic.chave + '</strong> - ' + statusText + ' 💾<br>';
                            html += '<small>';
                            html += 'Expira: ' + new Date(lic.expiraEm).toLocaleDateString('pt-BR') + ' | ';
                            html += 'Criada: ' + new Date(lic.criadaEm).toLocaleDateString('pt-BR');
                            if (lic.ultimoAcesso) {
                                html += ' | Último acesso: ' + new Date(lic.ultimoAcesso).toLocaleString('pt-BR');
                            }
                            html += '</small></div>';
                        });
                        resultado.innerHTML = html;
                    } else {
                        resultado.innerHTML = '<div class="resultado erro">❌ ' + data.erro + '</div>';
                    }
                } catch (error) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Erro ao listar</div>';
                }
            }

            function atualizarLista() {
                listarLicencas();
            }

            async function deletarLicenca() {
                const senha = document.getElementById('senhaAcao').value;
                const chave = document.getElementById('chaveAcao').value;
                const resultado = document.getElementById('resultadoAcao');

                if (!senha || !chave) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Preencha senha e chave!</div>';
                    return;
                }

                if (!confirm('Tem certeza que deseja DELETAR permanentemente esta licença?')) {
                    return;
                }

                try {
                    const response = await fetch('/admin/deletar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ senha, chave })
                    });

                    const data = await response.json();

                    if (data.sucesso) {
                        resultado.innerHTML = '<div class="resultado sucesso">🗑️ Licença deletada permanentemente!</div>';
                        document.getElementById('chaveAcao').value = '';

                        const senhaGerenciar = document.getElementById('senhaGerenciar').value;
                        if (senhaGerenciar === '8801') {
                            listarLicencas();
                        }
                    } else {
                        resultado.innerHTML = '<div class="resultado erro">❌ ' + data.erro + '</div>';
                    }
                } catch (error) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Erro ao deletar</div>';
                }
            }

            async function desativarLicenca() {
                const senha = document.getElementById('senhaAcao').value;
                const chave = document.getElementById('chaveAcao').value;
                const resultado = document.getElementById('resultadoAcao');

                if (!senha || !chave) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Preencha senha e chave!</div>';
                    return;
                }

                try {
                    const response = await fetch('/admin/desativar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ senha, chave })
                    });

                    const data = await response.json();

                    if (data.sucesso) {
                        resultado.innerHTML = '<div class="resultado sucesso">❌ Licença desativada permanentemente!</div>';

                        const senhaGerenciar = document.getElementById('senhaGerenciar').value;
                        if (senhaGerenciar === '8801') {
                            listarLicencas();
                        }
                    } else {
                        resultado.innerHTML = '<div class="resultado erro">❌ ' + data.erro + '</div>';
                    }
                } catch (error) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Erro ao desativar</div>';
                }
            }

            async function ativarLicenca() {
                const senha = document.getElementById('senhaAcao').value;
                const chave = document.getElementById('chaveAcao').value;
                const resultado = document.getElementById('resultadoAcao');

                if (!senha || !chave) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Preencha senha e chave!</div>';
                    return;
                }

                try {
                    const response = await fetch('/admin/ativar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ senha, chave })
                    });

                    const data = await response.json();

                    if (data.sucesso) {
                        resultado.innerHTML = '<div class="resultado sucesso">✅ Licença ativada permanentemente!</div>';

                        const senhaGerenciar = document.getElementById('senhaGerenciar').value;
                        if (senhaGerenciar === '8801') {
                            listarLicencas();
                        }
                    } else {
                        resultado.innerHTML = '<div class="resultado erro">❌ ' + data.erro + '</div>';
                    }
                } catch (error) {
                    resultado.innerHTML = '<div class="resultado erro">❌ Erro ao ativar</div>';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Rota para criar novas licenças
app.post('/admin/criar', (req, res) => {
  const { senha, chave, dias, contaMT5 } = req.body;

  if (senha !== SENHA_ADMIN) {
    return res.json({ sucesso: false, erro: 'Senha incorreta' });
  }

  if (licencas[chave]) {
    return res.json({ sucesso: false, erro: 'Chave já existe' });
  }

  const dataExpiracao = new Date();
  dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(dias));

  licencas[chave] = {
    conta: contaMT5 && contaMT5.trim() !== '' ? parseInt(contaMT5) : null,
    ativa: true,
    criadaEm: new Date(),
    expiraEm: dataExpiracao
  };

  // 💾 SALVAR IMEDIATAMENTE após criar licença
  salvarLicencas();

  const contaInfo = contaMT5 ? ` para conta ${contaMT5}` : ' (conta será associada no primeiro uso)';
  console.log(`✅ Nova licença criada: ${chave} (válida por ${dias} dias)${contaInfo}`);

  res.json({
    sucesso: true,
    chave: chave,
    expiraEm: dataExpiracao,
    dias: dias,
    conta: contaMT5 || null
  });
});

// Rota para listar licenças
app.post('/admin/listar', (req, res) => {
  const { senha } = req.body;

  if (senha !== SENHA_ADMIN) {
    return res.json({ sucesso: false, erro: 'Senha incorreta' });
  }

  const listaLicencas = Object.entries(licencas).map(([chave, dados]) => ({
    chave: chave,
    conta: dados.conta,
    ativa: dados.ativa,
    criadaEm: dados.criadaEm,
    expiraEm: dados.expiraEm,
    ultimoAcesso: dados.ultimoAcesso,
    expirada: new Date() > dados.expiraEm
  }));

  res.json({
    sucesso: true,
    licencas: listaLicencas
  });
});

// Rota para deletar licença
app.post('/admin/deletar', (req, res) => {
  const { senha, chave } = req.body;

  if (senha !== SENHA_ADMIN) {
    return res.json({ sucesso: false, erro: 'Senha incorreta' });
  }

  if (!licencas[chave]) {
    return res.json({ sucesso: false, erro: 'Licença não encontrada' });
  }

  delete licencas[chave];

  // 💾 SALVAR IMEDIATAMENTE após deletar
  salvarLicencas();

  console.log(`🗑️ Licença deletada: ${chave}`);

  res.json({ sucesso: true, mensagem: 'Licença deletada' });
});

// Rota para desativar licença
app.post('/admin/desativar', (req, res) => {
  const { senha, chave } = req.body;

  if (senha !== SENHA_ADMIN) {
    return res.json({ sucesso: false, erro: 'Senha incorreta' });
  }

  if (!licencas[chave]) {
    return res.json({ sucesso: false, erro: 'Licença não encontrada' });
  }

  licencas[chave].ativa = false;

  // 💾 SALVAR IMEDIATAMENTE após desativar
  salvarLicencas();

  console.log(`❌ Licença desativada: ${chave}`);

  res.json({ sucesso: true, mensagem: 'Licença desativada' });
});

// Rota para ativar licença
app.post('/admin/ativar', (req, res) => {
  const { senha, chave } = req.body;

  if (senha !== SENHA_ADMIN) {
    return res.json({ sucesso: false, erro: 'Senha incorreta' });
  }

  if (!licencas[chave]) {
    return res.json({ sucesso: false, erro: 'Licença não encontrada' });
  }

  licencas[chave].ativa = true;

  // 💾 SALVAR IMEDIATAMENTE após ativar
  salvarLicencas();

  console.log(`✅ Licença ativada: ${chave}`);

  res.json({ sucesso: true, mensagem: 'Licença ativada' });
});

// 🔄 SALVAR LICENÇAS QUANDO SERVIDOR FOR FECHADO
process.on('SIGINT', () => {
  console.log('\n🛑 Servidor sendo encerrado...');
  console.log('💾 Salvando licenças...');
  salvarLicencas();
  console.log('✅ Licenças salvas! Servidor encerrado.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Servidor sendo encerrado...');
  salvarLicencas();
  console.log('✅ Licenças salvas! Servidor encerrado.');
  process.exit(0);
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 =================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log('🚀 =================================');
  console.log('🔒 Senha admin: 8801');
  console.log('💾 Sistema PERSISTENTE ativo!');
  console.log(`📁 Licenças salvas em: ${ARQUIVO_LICENCAS}`);
  console.log(`🎫 Total de licenças: ${Object.keys(licencas).length}`);
  console.log('🚀 =================================');
});