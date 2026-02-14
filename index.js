const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;

const ARQUIVO = "ponto.json";

// ==============================
// Funções de arquivo
// ==============================
function carregarDados() {
    if (!fs.existsSync(ARQUIVO)) return {};
    return JSON.parse(fs.readFileSync(ARQUIVO));
}

function salvarDados(dados) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 4));
}

// ==============================
// Bot pronto
// ==============================
client.once('ready', () => {
    console.log(`Bot online como ${client.user.tag}`);
});

// ==============================
// Comandos
// ==============================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const dados = carregarDados();
    const userId = interaction.user.id;
    const hoje = new Date().toISOString().split('T')[0];

    if (!dados[userId]) dados[userId] = {};
    if (!dados[userId][hoje]) dados[userId][hoje] = {};

    // ==========================
    // ENTRAR
    // ==========================
    if (interaction.commandName === 'entrar') {

        if (dados[userId][hoje].entrada && !dados[userId][hoje].saida) {
            return interaction.reply({
                content: "⚠️ Você já iniciou o turno e ainda não finalizou.",
                ephemeral: true
            });
        }

        dados[userId][hoje] = {
            entrada: Date.now()
        };

        salvarDados(dados);

        return interaction.reply("✅ Ponto iniciado com sucesso!");
    }

    // ==========================
    // SAIR
    // ==========================
    if (interaction.commandName === 'sair') {

        if (!dados[userId][hoje].entrada || dados[userId][hoje].saida) {
            return interaction.reply({
                content: "⚠️ Você não iniciou um turno válido hoje.",
                ephemeral: true
            });
        }

        const entrada = dados[userId][hoje].entrada;
        const saida = Date.now();

        // AGORA SALVA COMO NÚMERO
        const totalHoras = (saida - entrada) / 1000 / 60 / 60;

        dados[userId][hoje].saida = saida;
        dados[userId][hoje].totalHoras = totalHoras;

        salvarDados(dados);

        return interaction.reply("⛔ Turno finalizado com sucesso!");
    }

    // ==========================
    // RELATORIO DIARIO
    // ==========================
    if (interaction.commandName === 'relatorio') {

        const user = interaction.options.getUser('usuario');
        const dadosAtualizados = carregarDados();
        const userData = dadosAtualizados[user.id];

        if (!userData || !userData[hoje] || !userData[hoje].totalHoras) {
            return interaction.reply({
                content: `📊 ${user.username} ainda não possui horas registradas hoje.`,
                ephemeral: true
            });
        }

        const horasHoje = Number(userData[hoje].totalHoras).toFixed(2);

        return interaction.reply({
            content: `📊 Relatório de ${user.username}\n\n🕒 Hoje trabalhou: ${horasHoje} horas.`,
            ephemeral: true
        });
    }

    // ==========================
    // RELATORIO SEMANAL
    // ==========================
    if (interaction.commandName === 'relatorio_semanal') {

        const user = interaction.options.getUser('usuario');
        const dadosAtualizados = carregarDados();
        const userData = dadosAtualizados[user.id];

        if (!userData) {
            return interaction.reply({
                content: "Usuário não possui registros.",
                ephemeral: true
            });
        }

        let totalSemana = 0;
        const hojeData = new Date();

        for (let i = 0; i < 7; i++) {
            const data = new Date();
            data.setDate(hojeData.getDate() - i);
            const dataFormatada = data.toISOString().split('T')[0];

            if (userData[dataFormatada] && userData[dataFormatada].totalHoras) {
                totalSemana += Number(userData[dataFormatada].totalHoras);
            }
        }

        let resposta = `📊 Relatório semanal de ${user.username}\n\n🕒 Trabalhou ${totalSemana.toFixed(2)} horas nos últimos 7 dias.`;

        if (totalSemana < 20) {
            resposta += "\n⚠️ Abaixo da meta mínima de 20 horas!";
        }

        return interaction.reply({
            content: resposta,
            ephemeral: true
        });
    }

    // ==========================
    // RESETAR SEMANA
    // ==========================
    if (interaction.commandName === 'resetar_semana') {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
            });
        }

        const dadosAtualizados = carregarDados();
        const hojeData = new Date();

        for (let user in dadosAtualizados) {
            for (let i = 0; i < 7; i++) {
                const data = new Date();
                data.setDate(hojeData.getDate() - i);
                const dataFormatada = data.toISOString().split('T')[0];

                if (dadosAtualizados[user][dataFormatada]) {
                    delete dadosAtualizados[user][dataFormatada];
                }
            }
        }

        salvarDados(dadosAtualizados);

        return interaction.reply("✅ Dados da última semana resetados com sucesso!");
    }

});

client.login(TOKEN);
