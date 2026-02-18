const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const ARQUIVO = "ponto.json";

function carregarDados() {
    if (!fs.existsSync(ARQUIVO)) return {};
    return JSON.parse(fs.readFileSync(ARQUIVO));
}

function salvarDados(dados) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 4));
}

client.once('ready', () => {
    console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "painel") {

            const embed = new EmbedBuilder()
                .setTitle("📋 Sistema de Ponto")
                .setDescription("Use os botões abaixo para registrar seu turno.")
                .setColor("Blue");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("iniciar")
                    .setLabel("Iniciar")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("pausar")
                    .setLabel("Pausar")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("finalizar")
                    .setLabel("Finalizar")
                    .setStyle(ButtonStyle.Danger)
            );

            return interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    if (!interaction.isButton()) return;

    const dados = carregarDados();
    const userId = interaction.user.id;
    const hoje = new Date().toISOString().split("T")[0];

    if (!dados[userId]) dados[userId] = {};
    if (!dados[userId][hoje]) dados[userId][hoje] = {};

    const agora = Date.now();

    if (interaction.customId === "iniciar") {

        dados[userId][hoje] = {
            inicio: agora,
            pausadoEm: null,
            totalPausado: 0
        };

        salvarDados(dados);

        return interaction.reply({ content: "🟢 Ponto iniciado!", ephemeral: true });
    }

    if (interaction.customId === "pausar") {

        if (!dados[userId][hoje].inicio) {
            return interaction.reply({ content: "Você não iniciou o ponto.", ephemeral: true });
        }

        dados[userId][hoje].pausadoEm = agora;
        salvarDados(dados);

        return interaction.reply({ content: "⏸ Ponto pausado!", ephemeral: true });
    }

    if (interaction.customId === "finalizar") {

        if (!dados[userId][hoje].inicio) {
            return interaction.reply({ content: "Você não iniciou o ponto.", ephemeral: true });
        }

        if (dados[userId][hoje].pausadoEm) {
            dados[userId][hoje].totalPausado += agora - dados[userId][hoje].pausadoEm;
        }

        const tempoTotal = agora - dados[userId][hoje].inicio - dados[userId][hoje].totalPausado;

        const horas = Math.floor(tempoTotal / 3600000);
        const minutos = Math.floor((tempoTotal % 3600000) / 60000);

        dados[userId][hoje].finalizado = true;
        dados[userId][hoje].horas = horas;
        dados[userId][hoje].minutos = minutos;

        salvarDados(dados);

        const canalLogs = interaction.guild.channels.cache.find(c => c.name === "logs-ponto");

        if (canalLogs) {
            canalLogs.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("📊 Registro de Ponto")
                        .setColor("Green")
                        .addFields(
                            { name: "Usuário", value: `<@${userId}>`, inline: true },
                            { name: "Total Trabalhado", value: `${horas}h ${minutos}m`, inline: true }
                        )
                        .setTimestamp()
                ]
            });
        }

        return interaction.reply({
            content: `🔴 Ponto finalizado! Você trabalhou ${horas}h ${minutos}m hoje.`,
            ephemeral: true
        });
    }

});

client.login(TOKEN);
