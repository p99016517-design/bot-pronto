const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1471917710764933141";
const GUILD_ID = "1471917439116775484";

const commands = [

    new SlashCommandBuilder()
        .setName('entrar')
        .setDescription('Iniciar turno'),

    new SlashCommandBuilder()
        .setName('sair')
        .setDescription('Finalizar turno'),

    new SlashCommandBuilder()
        .setName('relatorio')
        .setDescription('Ver relatório diário de horas')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Selecione o usuário')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('relatorio_semanal')
        .setDescription('Ver relatório semanal (últimos 7 dias)')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Selecione o usuário')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('resetar_semana')
        .setDescription('Resetar registros da última semana (Admin)')
        
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('✅ Comandos atualizados instantaneamente!');
    } catch (error) {
        console.error(error);
    }
})();
