# 📖 Guia de Uso - DeepCode Charm Framework

## Visão Geral

Este guia fornece exemplos práticos e avançados para usar e estender o DeepCode Charm Framework. Desde configuração básica até criação de charms personalizados complexos.

## 🚀 Configuração Inicial

### 1. Instalação Completa

```bash
# 1. Clone o repositório
git clone https://github.com/bryansmithsantos/deepcode-charm-remake.git
cd deepcode-charm/beta_version

# 2. Instale dependências
bun install

# 3. Configure ambiente
cp .env.example .env
```

### 2. Configuração do Bot Discord

1. **Acesse** [Discord Developer Portal](https://discord.com/developers/applications)
2. **Crie** nova aplicação
3. **Vá** para "Bot" > "Add Bot"
4. **Copie** o token e cole no arquivo `.env`
5. **Configure** permissões necessárias

### 3. Configuração de Permissões

**Permissões mínimas necessárias**:
- `Send Messages` (2048)
- `Read Message History` (65536)
- `Embed Links` (16384)
- `Use External Emojis` (262144)

**URL de convite**:
```
https://discord.com/oauth2/authorize?client_id=SEU_CLIENT_ID&permissions=346112&scope=bot
```

## 🎮 Usando os Charms Básicos

### Comando Say
```
# Básico
$say[Olá pessoal!]

# Com emojis
$say[🎉 Bem-vindos ao servidor! 🎉]

# Mensagem longa
$say[Esta é uma mensagem mais longa que demonstra 
como o charm say pode lidar com textos maiores 
mantendo a formatação adequada.]
```

### Comando Ping
```
# Teste de latência
$ping[]

# Resposta esperada:
# 🏓 Pong!
# 📡 Latência da API: 45ms
# 💬 Latência da Mensagem: 127ms
```

### Comando Embed
```
# Embed básico
$embed[Título|Descrição simples]

# Com cor hexadecimal
$embed[Aviso|Manutenção programada|#ff6b35]

# Com cor nomeada
$embed[Sucesso|Operação realizada com sucesso|green]

# Embed complexo
$embed[📊 Relatório Diário|Estatísticas do servidor atualizadas
Usuários online: 150
Mensagens hoje: 2.847
Novos membros: 12|blue]
```

### Comando Help
```
# Lista completa
$help[]

# Ajuda específica
$help[embed]
$help[say]
$help[ping]
```

## 🔧 Criando Charms Personalizados

### Exemplo 1: Charm de Dados

```typescript
// src/charms/dice.ts
import { CharmFunction, CharmMetadata } from '../types/index.js';

export const diceCharm: CharmFunction = async (context) => {
  const { message, args } = context;
  
  // Parse argumentos: $dice[6] ou $dice[2d6]
  const match = args.match(/^(\d+)?(?:d(\d+))?$/);
  
  if (!match) {
    await message.reply('❌ Uso: `$dice[6]` ou `$dice[2d6]`');
    return;
  }
  
  const [, numDice = '1', sides = '6'] = match;
  const diceCount = Math.min(parseInt(numDice), 10); // Max 10 dados
  const diceSides = Math.min(parseInt(sides), 100); // Max 100 lados
  
  const results = [];
  let total = 0;
  
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * diceSides) + 1;
    results.push(roll);
    total += roll;
  }
  
  const resultText = diceCount > 1 
    ? `🎲 **Resultados**: ${results.join(', ')}\n**Total**: ${total}`
    : `🎲 **Resultado**: ${total}`;
  
  await message.reply(resultText);
};

export const diceMetadata: CharmMetadata = {
  name: 'dice',
  description: 'Rola dados virtuais',
  usage: '$dice[lados] ou $dice[quantidadedlados]',
  adminOnly: false,
  cooldown: 2,
  category: 'fun'
};
```

### Exemplo 2: Charm de Enquete

```typescript
// src/charms/poll.ts
import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

export const pollCharm: CharmFunction = async (context) => {
  const { message, args } = context;
  
  // Parse: $poll[Pergunta|Opção1|Opção2|Opção3]
  const parts = args.split('|').map(p => p.trim());
  
  if (parts.length < 3 || parts.length > 11) {
    await message.reply('❌ Uso: `$poll[pergunta|opção1|opção2|...]` (2-10 opções)');
    return;
  }
  
  const [question, ...options] = parts;
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  const embed = new EmbedBuilder()
    .setTitle('📊 ' + question)
    .setColor(0x3498db)
    .setDescription(
      options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n')
    )
    .setFooter({
      text: `Enquete criada por ${message.author.username}`,
      iconURL: message.author.displayAvatarURL()
    })
    .setTimestamp();
  
  const pollMessage = await message.channel.send({ embeds: [embed] });
  
  // Adiciona reações
  for (let i = 0; i < options.length; i++) {
    await pollMessage.react(emojis[i]);
  }
  
  // Remove mensagem original
  if (message.deletable) {
    await message.delete().catch(() => {});
  }
};

export const pollMetadata: CharmMetadata = {
  name: 'poll',
  description: 'Cria uma enquete com opções',
  usage: '$poll[pergunta|opção1|opção2|...]',
  adminOnly: false,
  cooldown: 10,
  category: 'utility'
};
```

### Exemplo 3: Charm de Informações do Servidor

```typescript
// src/charms/serverinfo.ts
import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

export const serverinfoCharm: CharmFunction = async (context) => {
  const { message } = context;
  
  if (!message.guild) {
    await message.reply('❌ Este comando só funciona em servidores!');
    return;
  }
  
  const guild = message.guild;
  const owner = await guild.fetchOwner();
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .setColor(0x00AE86)
    .addFields([
      {
        name: '👑 Dono',
        value: owner.user.tag,
        inline: true
      },
      {
        name: '📅 Criado em',
        value: guild.createdAt.toLocaleDateString('pt-BR'),
        inline: true
      },
      {
        name: '👥 Membros',
        value: guild.memberCount.toString(),
        inline: true
      },
      {
        name: '📝 Canais',
        value: guild.channels.cache.size.toString(),
        inline: true
      },
      {
        name: '😀 Emojis',
        value: guild.emojis.cache.size.toString(),
        inline: true
      },
      {
        name: '🔒 Nível de Verificação',
        value: guild.verificationLevel.toString(),
        inline: true
      }
    ])
    .setFooter({
      text: `ID: ${guild.id}`,
      iconURL: guild.iconURL()
    })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
};

export const serverinfoMetadata: CharmMetadata = {
  name: 'serverinfo',
  description: 'Mostra informações do servidor atual',
  usage: '$serverinfo[]',
  adminOnly: false,
  cooldown: 5,
  category: 'information'
};
```

## 🔐 Charms com Permissões Admin

### Exemplo: Charm de Limpeza de Mensagens

```typescript
// src/charms/clear.ts
import { CharmFunction, CharmMetadata } from '../types/index.js';

export const clearCharm: CharmFunction = async (context) => {
  const { message, args, user } = context;
  
  // Verifica se é admin (já feito pelo framework, mas good practice)
  if (!user.isAdmin) {
    await message.reply('🚫 Apenas administradores podem usar este comando.');
    return;
  }
  
  const amount = parseInt(args);
  
  if (isNaN(amount) || amount < 1 || amount > 100) {
    await message.reply('❌ Especifique um número entre 1 e 100.');
    return;
  }
  
  try {
    // Busca mensagens
    const messages = await message.channel.messages.fetch({ limit: amount + 1 });
    
    // Remove mensagens (Discord limita bulk delete para msgs < 14 dias)
    const deleted = await message.channel.bulkDelete(messages, true);
    
    const confirmMsg = await message.channel.send(
      `✅ ${deleted.size - 1} mensagens removidas por ${user.username}`
    );
    
    // Remove mensagem de confirmação após 5 segundos
    setTimeout(() => {
      confirmMsg.delete().catch(() => {});
    }, 5000);
    
  } catch (error) {
    await message.reply('❌ Erro ao limpar mensagens. Verifique as permissões do bot.');
  }
};

export const clearMetadata: CharmMetadata = {
  name: 'clear',
  description: 'Remove mensagens do canal (apenas admin)',
  usage: '$clear[quantidade]',
  adminOnly: true, // Requer admin!
  cooldown: 5,
  category: 'moderation'
};
```

## 📊 Integrando com APIs Externas

### Exemplo: Charm de Clima

```typescript
// src/charms/weather.ts
import { EmbedBuilder } from 'discord.js';
import { CharmFunction, CharmMetadata } from '../types/index.js';

export const weatherCharm: CharmFunction = async (context) => {
  const { message, args } = context;
  
  if (!args) {
    await message.reply('❌ Especifique uma cidade: `$weather[São Paulo]`');
    return;
  }
  
  try {
    // Nota: Em produção, use uma API real como OpenWeatherMap
    const apiKey = process.env.WEATHER_API_KEY;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(args)}&appid=${apiKey}&units=metric&lang=pt_br`
    );
    
    if (!response.ok) {
      await message.reply('❌ Cidade não encontrada ou erro na API.');
      return;
    }
    
    const data = await response.json();
    
    const embed = new EmbedBuilder()
      .setTitle(`🌤️ Clima em ${data.name}, ${data.sys.country}`)
      .setDescription(data.weather[0].description)
      .setColor(0x87CEEB)
      .addFields([
        {
          name: '🌡️ Temperatura',
          value: `${Math.round(data.main.temp)}°C`,
          inline: true
        },
        {
          name: '🤔 Sensação Térmica',
          value: `${Math.round(data.main.feels_like)}°C`,
          inline: true
        },
        {
          name: '💧 Umidade',
          value: `${data.main.humidity}%`,
          inline: true
        }
      ])
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
  } catch (error) {
    await message.reply('❌ Erro ao buscar informações do clima.');
  }
};

export const weatherMetadata: CharmMetadata = {
  name: 'weather',
  description: 'Mostra informações do clima de uma cidade',
  usage: '$weather[cidade]',
  adminOnly: false,
  cooldown: 10, // API rate limiting
  category: 'utility'
};
```

## 🔄 Registrando Novos Charms

### No arquivo src/index.ts

```typescript
// Adicione os imports
import { diceCharm, diceMetadata } from './charms/dice.js';
import { pollCharm, pollMetadata } from './charms/poll.js';
import { serverinfoCharm, serverinfoMetadata } from './charms/serverinfo.js';
import { clearCharm, clearMetadata } from './charms/clear.js';
import { weatherCharm, weatherMetadata } from './charms/weather.js';

// Atualize a função registerBasicCharms
function registerBasicCharms(client: CharmClient): void {
  logger.info('Registrando charms...');

  const charms = [
    // Charms básicos
    { func: sayCharm, meta: sayMetadata },
    { func: pingCharm, meta: pingMetadata },
    { func: embedCharm, meta: embedMetadata },
    { func: helpCharm, meta: helpMetadata },
    
    // Charms personalizados
    { func: diceCharm, meta: diceMetadata },
    { func: pollCharm, meta: pollMetadata },
    { func: serverinfoCharm, meta: serverinfoMetadata },
    { func: clearCharm, meta: clearMetadata },
    { func: weatherCharm, meta: weatherMetadata }
  ];

  for (const { func, meta } of charms) {
    try {
      client.registerCharm(func, meta);
    } catch (error) {
      logger.error(`Erro ao registrar charm ${meta.name}`, error);
    }
  }

  logger.info(`✅ ${charms.length} charms registrados com sucesso`);
}
```

## ⚙️ Configurações Avançadas

### 1. Configuração por Ambiente

```typescript
// src/config/environments.ts
export const environments = {
  development: {
    logLevel: 'debug',
    rateLimit: { maxCommands: 50, timeWindow: 60 },
    allowedGuilds: [],
    adminUsers: ['123456789']
  },
  
  production: {
    logLevel: 'warn',
    rateLimit: { maxCommands: 10, timeWindow: 60 },
    allowedGuilds: ['prod_guild_1', 'prod_guild_2'],
    adminUsers: ['admin_1', 'admin_2']
  },
  
  testing: {
    logLevel: 'error',
    rateLimit: { maxCommands: 100, timeWindow: 1 },
    allowedGuilds: ['test_guild'],
    adminUsers: ['test_admin']
  }
};
```

### 2. Charms Condicionais

```typescript
// src/charms/conditional.ts
export const conditionalCharm: CharmFunction = async (context) => {
  const { message, args, guild } = context;
  
  // Funcionalidade diferente por servidor
  if (guild?.id === 'guild_especial') {
    await message.reply('Funcionalidade especial para este servidor!');
  } else {
    await message.reply('Funcionalidade padrão.');
  }
  
  // Horário específico
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    await message.reply('🌙 Modo noturno ativo - comandos limitados.');
    return;
  }
  
  // Lógica principal
  // ...
};
```

### 3. Persistência de Dados

```typescript
// src/utils/database.ts
import fs from 'fs/promises';

export class SimpleDB {
  private data = new Map();
  private readonly filePath: string;
  
  constructor(filePath = './data/bot_data.json') {
    this.filePath = filePath;
    this.load();
  }
  
  async load() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      this.data = new Map(Object.entries(parsed));
    } catch (error) {
      // Arquivo não existe, cria novo
      await this.save();
    }
  }
  
  async save() {
    const obj = Object.fromEntries(this.data);
    await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2));
  }
  
  get(key: string) {
    return this.data.get(key);
  }
  
  set(key: string, value: any) {
    this.data.set(key, value);
    this.save(); // Auto-save
  }
}

// Uso em charms
const db = new SimpleDB();

export const levelCharm: CharmFunction = async (context) => {
  const { message, user } = context;
  
  const userLevel = db.get(`level_${user.id}`) || 1;
  const userXP = db.get(`xp_${user.id}`) || 0;
  
  await message.reply(`📊 **Level**: ${userLevel} | **XP**: ${userXP}`);
};
```

## 🐛 Debug e Troubleshooting

### 1. Logs Detalhados

```typescript
// Habilite debug no .env
LOG_LEVEL=debug

// Ou programaticamente
import { Logger, LogLevel } from './src/core/Logger.js';
const logger = Logger.getInstance(LogLevel.DEBUG);
```

### 2. Teste de Charms

```typescript
// src/test-charms.ts
import { testMocks } from './tests/setup.js';
import { diceCharm } from './charms/dice.js';

async function testDice() {
  const context = testMocks.createCharmContext({
    args: '2d6',
    message: {
      reply: async (msg) => console.log('Bot replied:', msg)
    }
  });
  
  await diceCharm(context);
}

testDice();
```

### 3. Monitoramento em Produção

```typescript
// src/monitoring.ts
setInterval(() => {
  const stats = client.getStats();
  
  console.log('📊 Bot Stats:', {
    uptime: `${Math.floor(stats.uptime / 60)}min`,
    commands: stats.commandsExecuted,
    guilds: stats.guildsCount,
    memory: process.memoryUsage().heapUsed / 1024 / 1024 + 'MB'
  });
}, 5 * 60 * 1000); // A cada 5 minutos
```

## 📝 Dicas e Melhores Práticas

### 1. Validação Robusta
```typescript
// Sempre valide entrada dos usuários
if (!args || args.length > 100) {
  await message.reply('❌ Argumento inválido.');
  return;
}
```

### 2. Feedback Visual
```typescript
// Use emojis para melhor UX
✅ ❌ ⚠️ 🔄 📊 🎮 🛠️ 📋 🔒 💡
```

### 3. Mensagens de Erro Úteis
```typescript
// Seja específico nos erros
await message.reply('❌ Número deve estar entre 1 e 100. Você digitou: ' + args);
```

### 4. Rate Limiting Personalizado
```typescript
// Ajuste cooldowns por complexidade
const simpleCommand = { cooldown: 1 };
const complexCommand = { cooldown: 10 };
const heavyCommand = { cooldown: 30 };
```

---

Este guia cobre os aspectos principais do framework. Para mais exemplos e casos de uso específicos, consulte a [documentação completa](./API.md) ou entre em contato com a comunidade.
