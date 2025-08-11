# 📦 Guia Completo de Publicação - DeepCode Charm Framework

Este guia te ajudará a publicar o **DeepCode Charm Framework** no GitHub e NPM de forma manual e segura.

## 📋 Pré-requisitos

### 1. Contas Necessárias
- ✅ Conta no [GitHub](https://github.com)
- ✅ Conta no [NPM](https://www.npmjs.com)
- ✅ [Git](https://git-scm.com/) instalado
- ✅ [Bun](https://bun.sh) instalado

### 2. Configurações Iniciais
```bash
# Configure seu Git (se ainda não fez)
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"

# Faça login no NPM
npm login
```

## 🐙 Parte 1: Publicação no GitHub

### Passo 1: Criar Repositório no GitHub

1. **Acesse** https://github.com/new
2. **Nome do repositório**: `deepcode-charm-framework`
3. **Descrição**: `🔮 Framework modular para bots Discord - Alternativa ao aoi.js com sistema de charms`
4. **Visibilidade**: Público
5. **NÃO** inicialize com README (já temos um)
6. **Clique** em "Create repository"

### Passo 2: Preparar o Projeto

```bash
# Navegue para o diretório do projeto
cd deepcodecharm/beta_version

# Teste se tudo está funcionando
bun install
bun test
bun run build

# Verifique se não há erros
echo "✅ Projeto testado e funcionando!"
```

### Passo 3: Inicializar Git e Fazer Primeiro Commit

```bash
# Inicializar repositório git
git init

# Adicionar origin (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/deepcode-charm-framework.git

# Verificar se .gitignore está funcionando
git status
# Deve mostrar apenas arquivos relevantes (não node_modules, tests/, etc.)

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "🎉 Initial release: DeepCode Charm Framework v1.0.0

✨ Features:
- Sistema de charms modulares 
- Compatibilidade com formato aoi.js ($comando args)
- Sistema de sugestões para comandos errados
- Sistema de menções inteligente
- Rate limiting e segurança avançada
- Logging completo
- Testes automatizados
- Documentação completa

🔮 Charms inclusos: say, ping, embed, help
🛡️ Segurança: Validação de input, rate limiting, permissões
📚 Docs: README completo + guias de uso e segurança"

# Enviar para GitHub
git branch -M main
git push -u origin main
```

### Passo 4: Configurar o Repositório no GitHub

Após o push, acesse seu repositório no GitHub e:

1. **Vá em Settings > General**
2. **Na seção "Features"**:
   - ✅ Issues
   - ✅ Wiki  
   - ✅ Discussions
   - ✅ Projects

3. **Na seção "Pull Requests"**:
   - ✅ Allow merge commits
   - ✅ Allow squash merging
   - ✅ Allow rebase merging

4. **Adicione tópicos** (canto direito da página principal):
   - `discord-bot`
   - `framework`  
   - `typescript`
   - `bun`
   - `modular`
   - `aoi-js-alternative`

## 📦 Parte 2: Publicação no NPM

### Passo 1: Verificar Package.json

```bash
# Verificar se o package.json está correto
cat package.json | grep -E "(name|version|description|main|files)"

# Deve mostrar:
# "name": "deepcode-charm"
# "version": "1.0.0" 
# "description": "Framework modular..."
# "main": "src/index.js"
# "files": [...] (apenas arquivos essenciais)
```

### Passo 2: Testar Publicação (Dry Run)

```bash
# Simular publicação (não publica de verdade)
npm publish --dry-run

# Verificar que arquivos serão incluídos
# Deve listar apenas: src/, README.md, LICENSE, docs/SECURITY.md, docs/USAGE.md
# NÃO deve incluir: tests/, docs/ETAPA-*, example-bot/, etc.
```

### Passo 3: Publicar no NPM

```bash
# PUBLICAÇÃO REAL - Execute apenas quando tiver certeza!
npm publish

# Se der erro de nome já existente, altere o nome:
# Edite package.json -> "name": "deepcode-charm-framework"
# E rode novamente: npm publish
```

### Passo 4: Verificar Publicação

1. **Acesse**: https://www.npmjs.com/package/deepcode-charm
2. **Verifique**:
   - ✅ Descrição correta
   - ✅ Keywords presentes
   - ✅ README renderizado corretamente
   - ✅ Files tab mostra apenas arquivos necessários

## 🏷️ Parte 3: Criar Release no GitHub

### Passo 1: Criar Tag de Versão

```bash
# Criar tag para v1.0.0
git tag -a v1.0.0 -m "🔮 DeepCode Charm Framework v1.0.0

🎉 PRIMEIRO LANÇAMENTO!

✨ Características Principais:
• Sistema de charms modulares
• Compatibilidade formato aoi.js
• Sugestões de comandos inteligentes  
• Sistema de menções automático
• Rate limiting e segurança avançada
• Logging completo
• TypeScript + Bun otimizado

🔮 Charms Inclusos:
• $say - Enviar mensagens
• $ping - Testar latência
• $embed - Criar embeds personalizados
• $help - Sistema de ajuda

🛡️ Segurança:
• Validação rigorosa de inputs
• Rate limiting por usuário
• Sistema de permissões
• Logs de auditoria

📚 Documentação:
• README completo
• Guias de uso
• Exemplos práticos
• Guia de segurança"

# Enviar tag para GitHub
git push origin v1.0.0
```

### Passo 2: Criar Release no GitHub

1. **Acesse**: https://github.com/SEU_USUARIO/deepcode-charm-framework/releases/new
2. **Tag version**: `v1.0.0`
3. **Release title**: `🔮 DeepCode Charm Framework v1.0.0 - Framework Modular para Discord Bots`
4. **Description**: Cole o texto da tag acima
5. **✅ Set as the latest release**
6. **Clique** em "Publish release"

## 🚀 Parte 4: Pós-Publicação

### 1. Atualizar Links no README

Se você mudou o nome do pacote NPM, atualize:

```bash
# Editar README.md
# Trocar todas as referências para o nome correto
# Exemplo: npm install deepcode-charm-framework
```

### 2. Testar Instalação

```bash
# Em um diretório temporário
mkdir /tmp/teste-install
cd /tmp/teste-install

# Testar instalação
npm init -y
npm install deepcode-charm  # ou deepcode-charm-framework

# Testar importação
echo "import { CharmClient } from 'deepcode-charm'; console.log('OK!');" > test.js
node test.js
```

### 3. Criar Badge no README

Adicione badges ao README.md:

```markdown
[![npm](https://img.shields.io/npm/v/deepcode-charm)](https://www.npmjs.com/package/deepcode-charm)
[![GitHub](https://img.shields.io/github/license/SEU_USUARIO/deepcode-charm-framework)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/SEU_USUARIO/deepcode-charm-framework)](https://github.com/SEU_USUARIO/deepcode-charm-framework/stargazers)
```

## 🔄 Parte 5: Atualizações Futuras

### Para publicar uma nova versão:

```bash
# 1. Fazer alterações
# 2. Atualizar version no package.json
npm version patch  # 1.0.0 -> 1.0.1
# ou
npm version minor  # 1.0.0 -> 1.1.0  
# ou
npm version major  # 1.0.0 -> 2.0.0

# 3. Commit e push
git add .
git commit -m "🚀 Release v1.0.1: Bug fixes e melhorias"
git push

# 4. Publicar no NPM
npm publish

# 5. Criar nova tag e release no GitHub
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

## ❗ Dicas Importantes

### ✅ DO (Faça):
- **Teste** sempre antes de publicar
- **Versione** semanticamente (major.minor.patch)
- **Documente** mudanças no CHANGELOG.md
- **Use** conventional commits
- **Mantenha** .gitignore e .npmignore atualizados

### ❌ DON'T (Não faça):
- **Não publique** com testes falhando
- **Não inclua** arquivos desnecessários no NPM
- **Não esqueça** de atualizar a documentação
- **Não publique** tokens ou arquivos .env
- **Não use** `npm publish --force` sem necessidade

## 🆘 Solução de Problemas

### Erro: "Package name already exists"
```bash
# Altere o nome no package.json
# "name": "deepcode-charm-framework-seu-nome"
```

### Erro: "Git authentication failed"
```bash
# Configure token de acesso pessoal
# GitHub > Settings > Developer settings > Personal access tokens
# Use HTTPS: git remote set-url origin https://TOKEN@github.com/usuario/repo.git
```

### Erro: "NPM authentication failed"  
```bash
npm logout
npm login
# Digite suas credenciais
```

## 🎉 Parabéns!

Se você seguiu todos os passos, seu framework está:

- ✅ **GitHub**: Código fonte público e versionado
- ✅ **NPM**: Pacote instalável via `npm install`  
- ✅ **Releases**: Versões organizadas e documentadas
- ✅ **Documentação**: README completo e guias

**Compartilhe seu trabalho:**
- Post no Reddit r/discordjs
- Tweet sobre o projeto
- Adicione ao seu portfólio
- Contribua com a comunidade!

---

**📖 Documentação Adicional:**
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/publishing-packages-to-npm) 
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
