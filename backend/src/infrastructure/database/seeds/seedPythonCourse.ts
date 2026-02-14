import { eq } from 'drizzle-orm';
import { getDatabase } from '../connection.ts';
import {
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  categoriesTable,
} from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { usersTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';
import { env } from '@shared/config/env.ts';
import { v7 as uuidv7 } from 'uuid';

// ---------------------------------------------------------------------------
// Course content data: 6 modules, 18 lessons, ~60+ sections
// ---------------------------------------------------------------------------
const MODULES_DATA = [
  {
    title: 'Fundamentos do Python',
    description: 'Entender o que é Python e criar o primeiro programa.',
    order: 1,
    lessons: [
      {
        title: 'O que é Python?',
        slug: 'o-que-e-python',
        description: 'Compreender o papel do Python no desenvolvimento de software e suas aplicações.',
        type: 'text' as const,
        isFree: true,
        order: 1,
        sections: [
          {
            title: 'Entender o papel do Python no desenvolvimento',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# O papel do Python no desenvolvimento

Python é uma **linguagem de programação** de alto nível, criada por Guido van Rossum e lançada em 1991. É conhecida por sua sintaxe clara e legível, que prioriza a produtividade do desenvolvedor.

## Por que Python é tão popular?

Python é consistentemente uma das linguagens mais populares do mundo por várias razões:

### 1. Sintaxe simples e legível
Python foi projetado para ser fácil de ler e escrever. Compare:

**Python:**
\`\`\`python
if idade >= 18:
    print("Você é maior de idade")
\`\`\`

**Java:**
\`\`\`java
if (idade >= 18) {
    System.out.println("Você é maior de idade");
}
\`\`\`

### 2. Versatilidade
Python é usado em diversas áreas:

| Área | Uso do Python |
|------|---------------|
| **Web** | Django, Flask, FastAPI |
| **Data Science** | pandas, NumPy, Matplotlib |
| **Machine Learning** | TensorFlow, PyTorch, scikit-learn |
| **Automação** | Scripts, bots, web scraping |
| **Games** | Pygame |
| **Desktop** | Tkinter, PyQt |

### 3. Grande comunidade
Python tem uma das maiores comunidades de desenvolvedores, com:
- Milhares de bibliotecas no PyPI (Python Package Index)
- Documentação abundante
- Fóruns ativos e suporte

## Python é interpretado

Python é uma linguagem **interpretada**, o que significa:

1. Você escreve o código em um arquivo \`.py\`
2. O interpretador Python lê e executa linha por linha
3. Não precisa compilar antes de executar

Isso torna o desenvolvimento mais rápido e interativo.

## Aplicações reais do Python

- **YouTube** usa Python no backend
- **Instagram** é construído com Django
- **Netflix** usa Python para análise de dados
- **Google** usa Python extensivamente
- **NASA** usa Python para análise científica`,
            },
          },
          {
            title: 'Conhecer a história e filosofia do Python',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# A história e filosofia do Python

## Origem

Python foi criado por **Guido van Rossum** no final dos anos 1980, durante suas férias de Natal. Ele queria criar uma linguagem que fosse:
- Divertida de usar
- Fácil de ler
- Adequada para ensino e desenvolvimento rápido

O nome "Python" veio do grupo de comédia britânico **Monty Python**, não da cobra!

## O Zen do Python

Python tem uma filosofia clara, resumida no "Zen do Python" (PEP 20):

\`\`\`python
import this
\`\`\`

Alguns princípios importantes:

1. **Bonito é melhor que feio**
2. **Explícito é melhor que implícito**
3. **Simples é melhor que complexo**
4. **Legibilidade conta**
5. **Deve haver um — e preferencialmente só um — modo óbvio de fazer algo**

## Versões do Python

- **Python 1.0** (1994): Primeira versão oficial
- **Python 2.0** (2000): Introduziu list comprehensions e garbage collection
- **Python 3.0** (2008): Grande reformulação, não retrocompatível com Python 2
- **Python 2.7** (2010): Última versão do Python 2, suporte encerrado em 2020
- **Python 3.x** (atual): Versão moderna e recomendada

**Importante:** Sempre use Python 3.x. Python 2 está obsoleto.

## PEPs (Python Enhancement Proposals)

São documentos que descrevem novos recursos, processos e convenções do Python:
- **PEP 8**: Guia de estilo de código
- **PEP 20**: O Zen do Python
- **PEP 484**: Type hints`,
            },
          },
        ],
      },
      {
        title: 'Instalação e Ambiente',
        slug: 'instalacao-ambiente',
        description: 'Configurar o ambiente de desenvolvimento Python.',
        type: 'text' as const,
        isFree: true,
        order: 2,
        sections: [
          {
            title: 'Instalar Python',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Instalando Python

## Verificar se Python já está instalado

Abra o terminal e digite:

\`\`\`bash
python --version
# ou
python3 --version
\`\`\`

Se aparecer algo como "Python 3.11.x", você já tem Python instalado.

## Instalação por Sistema Operacional

### Windows

1. Acesse [python.org/downloads](https://www.python.org/downloads/)
2. Baixe o instalador mais recente
3. **IMPORTANTE**: Marque "Add Python to PATH"
4. Clique em "Install Now"

### macOS

Python 2.7 vem pré-instalado, mas você deve instalar Python 3:

**Opção 1 - Homebrew (recomendado):**
\`\`\`bash
brew install python3
\`\`\`

**Opção 2 - Instalador oficial:**
Baixe de [python.org](https://www.python.org/downloads/)

### Linux

A maioria das distribuições já vem com Python 3:

**Ubuntu/Debian:**
\`\`\`bash
sudo apt update
sudo apt install python3 python3-pip
\`\`\`

**Fedora:**
\`\`\`bash
sudo dnf install python3 python3-pip
\`\`\`

## Verificar a instalação

Após instalar, verifique:

\`\`\`bash
python3 --version
pip3 --version
\`\`\`

## O que é pip?

**pip** é o gerenciador de pacotes do Python. Com ele você instala bibliotecas externas:

\`\`\`bash
pip install requests
pip install pandas
\`\`\``,
            },
          },
          {
            title: 'Escolher um editor de código',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Escolhendo um editor de código

## Editores recomendados

### 1. VS Code (Recomendado)
- **Gratuito e open source**
- Extensão Python oficial da Microsoft
- Autocomplete, debugging, linting
- Terminal integrado

**Extensões essenciais:**
- Python (Microsoft)
- Pylance
- Python Indent

### 2. PyCharm
- IDE completa para Python
- Versão Community (gratuita)
- Debugging avançado
- Refatoração inteligente

### 3. Jupyter Notebook
- Ideal para Data Science
- Execução interativa
- Visualizações inline

### 4. Sublime Text / Atom
- Leves e rápidos
- Boas para iniciantes

## IDLE (Incluído com Python)

Python vem com um editor básico chamado IDLE:
- Simples e funcional
- Bom para começar
- Shell interativo integrado

## Ambiente virtual (venv)

**Importante:** Sempre use ambientes virtuais para projetos:

\`\`\`bash
# Criar ambiente virtual
python3 -m venv meu_projeto_env

# Ativar
# Linux/Mac:
source meu_projeto_env/bin/activate
# Windows:
meu_projeto_env\\Scripts\\activate

# Desativar
deactivate
\`\`\`

Ambientes virtuais isolam as dependências de cada projeto.`,
            },
          },
        ],
      },
      {
        title: 'Primeiro Programa Python',
        slug: 'primeiro-programa',
        description: 'Escrever e executar o primeiro programa em Python.',
        type: 'text' as const,
        isFree: true,
        order: 3,
        sections: [
          {
            title: 'O clássico "Hello, World!"',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Seu primeiro programa Python

## O programa mais simples

Crie um arquivo chamado \`hello.py\`:

\`\`\`python
print("Hello, World!")
\`\`\`

Execute no terminal:

\`\`\`bash
python3 hello.py
\`\`\`

Saída:
\`\`\`
Hello, World!
\`\`\`

## Entendendo o código

- \`print()\` é uma **função** que exibe texto na tela
- O texto entre aspas é uma **string** (texto)
- Não precisa de ponto e vírgula no final da linha!

## Usando o shell interativo

Você também pode executar Python interativamente:

\`\`\`bash
python3
\`\`\`

Agora você está no REPL (Read-Eval-Print Loop):

\`\`\`python
>>> print("Olá!")
Olá!
>>> 2 + 2
4
>>> nome = "Maria"
>>> print(f"Bem-vinda, {nome}!")
Bem-vinda, Maria!
>>> exit()
\`\`\`

## Comentários

Use \`#\` para comentários:

\`\`\`python
# Isto é um comentário
print("Isso será executado")  # Comentário no final da linha
\`\`\`

Comentários são ignorados pelo interpretador.`,
            },
          },
          {
            title: 'Prática: Personalize seu Hello World',
            contentType: 'exercise' as const,
            order: 2,
            content: {
              instructions: `Crie um programa que:

1. Exiba "Olá, meu nome é [SEU NOME]"
2. Exiba "Estou aprendendo Python!"
3. Exiba uma linha em branco
4. Exiba "Python é incrível!"

Use a função \`print()\` para cada linha.`,
              starterCode: `# Seu código aqui
`,
              hints: [
                'Use print() para cada mensagem',
                'Para linha em branco, use print() sem argumentos ou print("")',
                'Strings podem usar aspas simples ou duplas: "texto" ou \'texto\'',
              ],
              solution: `# Solução
print("Olá, meu nome é João")
print("Estou aprendendo Python!")
print()
print("Python é incrível!")`,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Variáveis e Tipos de Dados',
    description: 'Trabalhar com diferentes tipos de dados em Python.',
    order: 2,
    lessons: [
      {
        title: 'Variáveis e Atribuição',
        slug: 'variaveis-atribuicao',
        description: 'Aprender a criar e usar variáveis em Python.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Criando variáveis',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Variáveis em Python

## O que é uma variável?

Uma variável é um **nome** que armazena um **valor** na memória.

\`\`\`python
nome = "Maria"
idade = 25
altura = 1.65
\`\`\`

## Atribuição

Use o operador \`=\` para atribuir valores:

\`\`\`python
x = 10        # x recebe 10
y = x + 5     # y recebe 15 (10 + 5)
x = 20        # x agora vale 20, y continua 15
\`\`\`

## Regras para nomes de variáveis

✅ **Permitido:**
\`\`\`python
nome = "João"
idade_usuario = 30
numero1 = 42
_privado = "interno"
CONSTANTE = 3.14
\`\`\`

❌ **Não permitido:**
\`\`\`python
2variavel = 10      # Não pode começar com número
meu-nome = "Ana"    # Não pode usar hífen
class = "A"         # Não pode usar palavras reservadas
\`\`\`

## Convenções (PEP 8)

- **snake_case** para variáveis e funções: \`meu_nome\`, \`calcular_total()\`
- **UPPER_CASE** para constantes: \`PI\`, \`MAX_TENTATIVAS\`
- **PascalCase** para classes: \`MinhaClasse\`, \`Usuario\`

## Tipagem dinâmica

Python descobre o tipo automaticamente:

\`\`\`python
x = 10       # int
x = "texto"  # agora é str
x = 3.14     # agora é float
\`\`\`

Você pode mudar o tipo de uma variável a qualquer momento.

## Múltiplas atribuições

\`\`\`python
# Múltiplas variáveis em uma linha
a, b, c = 1, 2, 3

# Mesmo valor para múltiplas variáveis
x = y = z = 0

# Trocar valores
a, b = b, a
\`\`\``,
            },
          },
          {
            title: 'Verificar tipos com type()',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Verificando tipos de dados

## A função type()

Use \`type()\` para descobrir o tipo de uma variável:

\`\`\`python
nome = "Python"
idade = 30
preco = 19.99
ativo = True

print(type(nome))    # <class 'str'>
print(type(idade))   # <class 'int'>
print(type(preco))   # <class 'float'>
print(type(ativo))   # <class 'bool'>
\`\`\`

## Tipos básicos

| Tipo | Exemplo | Descrição |
|------|---------|-----------|
| \`int\` | \`42\`, \`-10\` | Números inteiros |
| \`float\` | \`3.14\`, \`-0.5\` | Números decimais |
| \`str\` | \`"texto"\`, \`'abc'\` | Texto |
| \`bool\` | \`True\`, \`False\` | Booleano |
| \`NoneType\` | \`None\` | Ausência de valor |

## Conversão de tipos (type casting)

\`\`\`python
# Converter para int
numero = int("42")        # 42
numero = int(3.9)         # 3 (trunca)

# Converter para float
preco = float("19.99")    # 19.99
preco = float(10)         # 10.0

# Converter para str
texto = str(42)           # "42"
texto = str(3.14)         # "3.14"

# Converter para bool
resultado = bool(1)       # True
resultado = bool(0)       # False
resultado = bool("")      # False
resultado = bool("texto") # True
\`\`\`

## Valores "falsy"

Em contextos booleanos, são considerados False:
- \`0\`, \`0.0\`
- \`""\` (string vazia)
- \`None\`
- \`[]\`, \`{}\`, \`()\` (coleções vazias)

Tudo mais é True.`,
            },
          },
        ],
      },
      {
        title: 'Números e Operações',
        slug: 'numeros-operacoes',
        description: 'Trabalhar com números e operadores matemáticos.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Operadores aritméticos',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Operadores aritméticos em Python

## Operadores básicos

\`\`\`python
a = 10
b = 3

# Adição
print(a + b)    # 13

# Subtração
print(a - b)    # 7

# Multiplicação
print(a * b)    # 30

# Divisão (sempre retorna float)
print(a / b)    # 3.3333333333333335

# Divisão inteira (descarta a parte decimal)
print(a // b)   # 3

# Módulo (resto da divisão)
print(a % b)    # 1

# Potenciação
print(a ** b)   # 1000 (10³)
\`\`\`

## Ordem de precedência

Python segue a ordem matemática padrão (PEMDAS):

1. Parênteses \`()\`
2. Potenciação \`**\`
3. Multiplicação \`*\`, Divisão \`/\`, \`//\`, Módulo \`%\`
4. Adição \`+\`, Subtração \`-\`

\`\`\`python
resultado = 2 + 3 * 4       # 14 (não 20)
resultado = (2 + 3) * 4     # 20
resultado = 10 + 2 ** 3     # 18 (10 + 8)
\`\`\`

## Operadores de atribuição compostos

\`\`\`python
x = 10

x += 5    # x = x + 5  → 15
x -= 3    # x = x - 3  → 12
x *= 2    # x = x * 2  → 24
x /= 4    # x = x / 4  → 6.0
x //= 2   # x = x // 2 → 3.0
x %= 2    # x = x % 2  → 1.0
x **= 3   # x = x ** 3 → 1.0
\`\`\`

## Funções matemáticas úteis

\`\`\`python
# Valor absoluto
print(abs(-10))      # 10

# Arredondamento
print(round(3.7))    # 4
print(round(3.14159, 2))  # 3.14

# Máximo e mínimo
print(max(1, 5, 3))  # 5
print(min(1, 5, 3))  # 1

# Potência
print(pow(2, 3))     # 8 (mesmo que 2 ** 3)
\`\`\`

## Módulo math

Para funções mais avançadas:

\`\`\`python
import math

print(math.sqrt(16))     # 4.0 (raiz quadrada)
print(math.pi)           # 3.141592653589793
print(math.ceil(3.2))    # 4 (arredonda para cima)
print(math.floor(3.9))   # 3 (arredonda para baixo)
print(math.sin(math.pi/2))  # 1.0
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Strings e Manipulação de Texto',
        slug: 'strings-texto',
        description: 'Trabalhar com strings e formatação de texto.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Criando e manipulando strings',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Strings em Python

## Criando strings

\`\`\`python
# Aspas simples ou duplas
nome = 'Python'
nome = "Python"

# Aspas triplas para múltiplas linhas
texto = """
Este é um texto
com várias linhas
"""

# String vazia
vazio = ""
\`\`\`

## Caracteres especiais

\`\`\`python
# Nova linha
print("Linha 1\\nLinha 2")

# Tab
print("Nome\\tIdade")

# Aspas dentro de strings
print("Ele disse: \\"Olá!\\"")
print('Ele disse: "Olá!"')  # Mais simples

# Barra invertida literal
print("Caminho: C:\\\\Users\\\\nome")
\`\`\`

## Raw strings (r-strings)

\`\`\`python
# Útil para caminhos e regex
caminho = r"C:\\Users\\nome"
\`\`\`

## Concatenação

\`\`\`python
primeiro = "Python"
segundo = "Programming"

# Com +
completo = primeiro + " " + segundo  # "Python Programming"

# Repetição com *
linha = "-" * 20  # "--------------------"
\`\`\`

## Indexação e fatiamento

Strings são **sequências** de caracteres:

\`\`\`python
texto = "Python"

# Indexação (começa em 0)
print(texto[0])   # 'P'
print(texto[5])   # 'n'
print(texto[-1])  # 'n' (último)
print(texto[-2])  # 'o' (penúltimo)

# Fatiamento [início:fim]
print(texto[0:3])   # 'Pyt' (índices 0, 1, 2)
print(texto[:3])    # 'Pyt' (do início até 3)
print(texto[3:])    # 'hon' (de 3 até o fim)
print(texto[-3:])   # 'hon' (últimos 3)

# Com passo [início:fim:passo]
print(texto[::2])   # 'Pto' (pula de 2 em 2)
print(texto[::-1])  # 'nohtyP' (inverte)
\`\`\`

## Tamanho da string

\`\`\`python
texto = "Python"
print(len(texto))  # 6
\`\`\`

## Strings são imutáveis

\`\`\`python
nome = "Python"
# nome[0] = 'J'  # ERRO! Não pode modificar

# Solução: criar nova string
nome = "J" + nome[1:]  # "Jython"
\`\`\``,
            },
          },
          {
            title: 'Métodos de strings',
            contentType: 'text' as const,
            order: 2,
            content: {
              body: `# Métodos úteis de strings

## Maiúsculas e minúsculas

\`\`\`python
texto = "Python Programming"

print(texto.upper())       # "PYTHON PROGRAMMING"
print(texto.lower())       # "python programming"
print(texto.capitalize())  # "Python programming"
print(texto.title())       # "Python Programming"
print(texto.swapcase())    # "pYTHON pROGRAMMING"
\`\`\`

## Busca e verificação

\`\`\`python
texto = "Python é incrível"

# Buscar substring
print(texto.find("é"))          # 7 (índice)
print(texto.find("Java"))       # -1 (não encontrado)

# Verificar presença
print("Python" in texto)        # True
print("Java" in texto)          # False

# Começa/termina com
print(texto.startswith("Python"))  # True
print(texto.endswith("vel"))       # True

# Contar ocorrências
print(texto.count("i"))            # 2
\`\`\`

## Limpeza de espaços

\`\`\`python
texto = "  Python  "

print(texto.strip())   # "Python" (remove espaços das pontas)
print(texto.lstrip())  # "Python  " (remove à esquerda)
print(texto.rstrip())  # "  Python" (remove à direita)
\`\`\`

## Substituição

\`\`\`python
texto = "Python é legal"

novo = texto.replace("legal", "incrível")
print(novo)  # "Python é incrível"

# Substituir várias vezes
texto = "um dois um três um"
novo = texto.replace("um", "1", 2)  # Substitui apenas 2 vezes
print(novo)  # "1 dois 1 três um"
\`\`\`

## Divisão e junção

\`\`\`python
# Split (dividir)
texto = "Python,Java,JavaScript"
linguagens = texto.split(",")
print(linguagens)  # ['Python', 'Java', 'JavaScript']

frase = "Python é incrível"
palavras = frase.split()  # Split por espaços
print(palavras)  # ['Python', 'é', 'incrível']

# Join (juntar)
lista = ['Python', 'Java', 'JavaScript']
texto = ", ".join(lista)
print(texto)  # "Python, Java, JavaScript"
\`\`\`

## Verificação de tipo

\`\`\`python
print("123".isdigit())      # True
print("abc".isalpha())      # True
print("abc123".isalnum())   # True
print("   ".isspace())      # True
print("Python".istitle())   # True
\`\`\``,
            },
          },
          {
            title: 'Formatação de strings',
            contentType: 'text' as const,
            order: 3,
            content: {
              body: `# Formatação de strings em Python

## F-strings (Python 3.6+) — Recomendado

A forma mais moderna e legível:

\`\`\`python
nome = "Maria"
idade = 25

# Básico
mensagem = f"Olá, {nome}!"
print(mensagem)  # "Olá, Maria!"

# Expressões
print(f"{nome} tem {idade} anos")
print(f"No próximo ano terá {idade + 1} anos")

# Formatação de números
pi = 3.14159
print(f"Pi: {pi:.2f}")  # "Pi: 3.14"

preco = 1234.5
print(f"Preço: R$ {preco:,.2f}")  # "Preço: R$ 1,234.50"

# Alinhamento
nome = "Python"
print(f"{nome:>10}")   # "    Python" (direita)
print(f"{nome:<10}")   # "Python    " (esquerda)
print(f"{nome:^10}")   # "  Python  " (centro)

# Preenchimento
numero = 7
print(f"{numero:03}")  # "007"
\`\`\`

## Método format() (antigo)

\`\`\`python
nome = "João"
idade = 30

print("Olá, {}!".format(nome))
print("{} tem {} anos".format(nome, idade))
print("{1} tem {0} anos".format(idade, nome))  # Por posição
print("{n} tem {i} anos".format(n=nome, i=idade))  # Por nome
\`\`\`

## % formatting (muito antigo)

\`\`\`python
nome = "Ana"
idade = 28

print("Olá, %s!" % nome)
print("%s tem %d anos" % (nome, idade))
\`\`\`

## Strings multilinha formatadas

\`\`\`python
nome = "Python"
versao = 3.11

relatorio = f"""
Linguagem: {nome}
Versão: {versao}
Status: {'Ativa' if versao >= 3 else 'Obsoleta'}
"""
print(relatorio)
\`\`\`

## Especificadores de formato úteis

\`\`\`python
numero = 1234567.89

# Separador de milhares
print(f"{numero:,}")        # "1,234,567.89"

# Notação científica
print(f"{numero:e}")        # "1.234568e+06"

# Percentual
taxa = 0.156
print(f"{taxa:.1%}")        # "15.6%"

# Hexadecimal, binário, octal
num = 255
print(f"{num:x}")           # "ff"
print(f"{num:b}")           # "11111111"
print(f"{num:o}")           # "377"
\`\`\``,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Estruturas de Controle',
    description: 'Controlar o fluxo de execução do programa.',
    order: 3,
    lessons: [
      {
        title: 'Condicionais (if, elif, else)',
        slug: 'condicionais',
        description: 'Tomar decisões no código com estruturas condicionais.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Estrutura if básica',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Estruturas condicionais em Python

## if simples

\`\`\`python
idade = 18

if idade >= 18:
    print("Você é maior de idade")
    print("Pode votar")
\`\`\`

**Importante:** Python usa **indentação** (4 espaços ou 1 tab) para delimitar blocos!

## if-else

\`\`\`python
idade = 16

if idade >= 18:
    print("Maior de idade")
else:
    print("Menor de idade")
\`\`\`

## if-elif-else

\`\`\`python
nota = 75

if nota >= 90:
    print("A")
elif nota >= 80:
    print("B")
elif nota >= 70:
    print("C")
elif nota >= 60:
    print("D")
else:
    print("F")
\`\`\`

## Operadores de comparação

\`\`\`python
x = 10
y = 5

print(x == y)   # False (igual)
print(x != y)   # True  (diferente)
print(x > y)    # True  (maior)
print(x < y)    # False (menor)
print(x >= y)   # True  (maior ou igual)
print(x <= y)   # False (menor ou igual)
\`\`\`

## Operadores lógicos

\`\`\`python
idade = 20
tem_carteira = True

# and (E)
if idade >= 18 and tem_carteira:
    print("Pode dirigir")

# or (OU)
dia = "sábado"
if dia == "sábado" or dia == "domingo":
    print("Final de semana!")

# not (NÃO)
chovendo = False
if not chovendo:
    print("Pode sair sem guarda-chuva")
\`\`\`

## Expressão condicional (operador ternário)

\`\`\`python
idade = 20
status = "maior" if idade >= 18 else "menor"
print(status)  # "maior"

# Equivalente a:
if idade >= 18:
    status = "maior"
else:
    status = "menor"
\`\`\`

## if aninhado

\`\`\`python
idade = 25
tem_ingresso = True

if idade >= 18:
    if tem_ingresso:
        print("Pode entrar")
    else:
        print("Precisa de ingresso")
else:
    print("Entrada proibida para menores")
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Laços de Repetição - for',
        slug: 'loop-for',
        description: 'Repetir código com laços for.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Loop for básico',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Laço for em Python

## for com range()

\`\`\`python
# range(fim) - de 0 até fim-1
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

# range(início, fim)
for i in range(1, 6):
    print(i)  # 1, 2, 3, 4, 5

# range(início, fim, passo)
for i in range(0, 10, 2):
    print(i)  # 0, 2, 4, 6, 8

# Decrescente
for i in range(5, 0, -1):
    print(i)  # 5, 4, 3, 2, 1
\`\`\`

## for com listas

\`\`\`python
frutas = ["maçã", "banana", "laranja"]

for fruta in frutas:
    print(fruta)
# maçã
# banana
# laranja
\`\`\`

## for com strings

\`\`\`python
palavra = "Python"

for letra in palavra:
    print(letra)
# P
# y
# t
# h
# o
# n
\`\`\`

## enumerate() - índice + valor

\`\`\`python
linguagens = ["Python", "Java", "JavaScript"]

for indice, linguagem in enumerate(linguagens):
    print(f"{indice}: {linguagem}")
# 0: Python
# 1: Java
# 2: JavaScript

# Começar do índice 1
for indice, linguagem in enumerate(linguagens, start=1):
    print(f"{indice}. {linguagem}")
# 1. Python
# 2. Java
# 3. JavaScript
\`\`\`

## break e continue

\`\`\`python
# break - sai do loop
for i in range(10):
    if i == 5:
        break
    print(i)  # 0, 1, 2, 3, 4

# continue - pula para próxima iteração
for i in range(5):
    if i == 2:
        continue
    print(i)  # 0, 1, 3, 4
\`\`\`

## else com for

\`\`\`python
# else executa se o loop completar sem break
for i in range(5):
    print(i)
else:
    print("Loop concluído!")
# 0, 1, 2, 3, 4, Loop concluído!

# Com break, else não executa
for i in range(5):
    if i == 3:
        break
    print(i)
else:
    print("Não será exibido")
# 0, 1, 2
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Laços de Repetição - while',
        slug: 'loop-while',
        description: 'Repetir código com laços while.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Loop while básico',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Laço while em Python

## while básico

\`\`\`python
contador = 0

while contador < 5:
    print(contador)
    contador += 1
# 0, 1, 2, 3, 4
\`\`\`

## Loop infinito (com break)

\`\`\`python
while True:
    resposta = input("Digite 'sair' para encerrar: ")
    if resposta == "sair":
        break
    print(f"Você digitou: {resposta}")
\`\`\`

## while com continue

\`\`\`python
numero = 0

while numero < 10:
    numero += 1
    if numero % 2 == 0:
        continue  # Pula números pares
    print(numero)
# 1, 3, 5, 7, 9
\`\`\`

## while vs for

**Use for quando:**
- Sabe o número de iterações
- Iterando sobre uma sequência

**Use while quando:**
- Condição de parada é complexa
- Não sabe quantas iterações serão necessárias

\`\`\`python
# for - número conhecido
for i in range(10):
    print(i)

# while - condição de parada
senha_correta = "1234"
tentativas = 0

while tentativas < 3:
    senha = input("Digite a senha: ")
    if senha == senha_correta:
        print("Acesso concedido!")
        break
    tentativas += 1
else:
    print("Acesso negado!")
\`\`\``,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Funções',
    description: 'Organizar código com funções reutilizáveis.',
    order: 4,
    lessons: [
      {
        title: 'Definindo e Chamando Funções',
        slug: 'definindo-funcoes',
        description: 'Criar e usar funções em Python.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Funções básicas',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Funções em Python

## Definindo funções

\`\`\`python
def saudacao():
    print("Olá, mundo!")

# Chamar a função
saudacao()  # "Olá, mundo!"
\`\`\`

## Funções com parâmetros

\`\`\`python
def saudar(nome):
    print(f"Olá, {nome}!")

saudar("Maria")  # "Olá, Maria!"
saudar("João")   # "Olá, João!"
\`\`\`

## Múltiplos parâmetros

\`\`\`python
def somar(a, b):
    resultado = a + b
    print(f"{a} + {b} = {resultado}")

somar(5, 3)  # "5 + 3 = 8"
\`\`\`

## Retornando valores

\`\`\`python
def somar(a, b):
    return a + b

resultado = somar(10, 5)
print(resultado)  # 15

# Usar diretamente
print(somar(3, 4))  # 7
\`\`\`

## Múltiplos retornos

\`\`\`python
def operacoes(a, b):
    soma = a + b
    diferenca = a - b
    return soma, diferenca

s, d = operacoes(10, 3)
print(s)  # 13
print(d)  # 7
\`\`\`

## Parâmetros padrão

\`\`\`python
def saudar(nome, saudacao="Olá"):
    print(f"{saudacao}, {nome}!")

saudar("Maria")              # "Olá, Maria!"
saudar("João", "Bem-vindo")  # "Bem-vindo, João!"
\`\`\`

## Argumentos nomeados

\`\`\`python
def criar_perfil(nome, idade, cidade):
    print(f"{nome}, {idade} anos, {cidade}")

# Ordem posicional
criar_perfil("Ana", 25, "São Paulo")

# Argumentos nomeados (ordem não importa)
criar_perfil(idade=30, cidade="Rio", nome="Carlos")
\`\`\`

## Docstrings

\`\`\`python
def calcular_area(base, altura):
    """
    Calcula a área de um retângulo.

    Parâmetros:
        base (float): Base do retângulo
        altura (float): Altura do retângulo

    Retorna:
        float: Área do retângulo
    """
    return base * altura

# Acessar a documentação
print(calcular_area.__doc__)
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Escopo de Variáveis',
        slug: 'escopo-variaveis',
        description: 'Entender escopo local e global.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Escopo local vs global',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Escopo de variáveis

## Variáveis locais

\`\`\`python
def minha_funcao():
    x = 10  # Variável local
    print(x)

minha_funcao()  # 10
# print(x)  # ERRO! x não existe fora da função
\`\`\`

## Variáveis globais

\`\`\`python
x = 100  # Variável global

def minha_funcao():
    print(x)  # Pode acessar global

minha_funcao()  # 100
print(x)        # 100
\`\`\`

## Modificando global

\`\`\`python
contador = 0

def incrementar():
    global contador  # Necessário para modificar
    contador += 1

incrementar()
print(contador)  # 1
\`\`\`

## Sombreamento

\`\`\`python
x = "global"

def funcao():
    x = "local"  # Cria nova variável local
    print(x)

funcao()   # "local"
print(x)   # "global" (não foi modificada)
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Funções Lambda',
        slug: 'funcoes-lambda',
        description: 'Criar funções anônimas concisas.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Lambda básico',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Funções Lambda

## O que são lambdas?

Funções anônimas de uma linha:

\`\`\`python
# Função normal
def quadrado(x):
    return x ** 2

# Lambda equivalente
quadrado = lambda x: x ** 2

print(quadrado(5))  # 25
\`\`\`

## Sintaxe

\`\`\`
lambda parâmetros: expressão
\`\`\`

## Múltiplos parâmetros

\`\`\`python
somar = lambda a, b: a + b
print(somar(3, 4))  # 7

maior = lambda a, b: a if a > b else b
print(maior(10, 5))  # 10
\`\`\`

## Uso com map()

\`\`\`python
numeros = [1, 2, 3, 4, 5]

# Aplicar função a cada elemento
quadrados = list(map(lambda x: x ** 2, numeros))
print(quadrados)  # [1, 4, 9, 16, 25]
\`\`\`

## Uso com filter()

\`\`\`python
numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Filtrar elementos
pares = list(filter(lambda x: x % 2 == 0, numeros))
print(pares)  # [2, 4, 6, 8, 10]
\`\`\`

## Uso com sorted()

\`\`\`python
alunos = [
    {"nome": "Ana", "nota": 8.5},
    {"nome": "Bruno", "nota": 9.2},
    {"nome": "Carlos", "nota": 7.8},
]

# Ordenar por nota
ordenados = sorted(alunos, key=lambda aluno: aluno["nota"])
\`\`\`

## Quando usar?

**Use lambda:**
- Funções simples de uma linha
- Callbacks e funções passadas como argumento

**Use def:**
- Funções mais complexas
- Quando precisa de nome descritivo
- Múltiplas linhas`,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Estruturas de Dados',
    description: 'Trabalhar com listas, tuplas, sets e dicionários.',
    order: 5,
    lessons: [
      {
        title: 'Listas',
        slug: 'listas',
        description: 'Coleções ordenadas e mutáveis.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Criando e manipulando listas',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Listas em Python

## Criando listas

\`\`\`python
# Lista vazia
lista = []
lista = list()

# Lista com elementos
numeros = [1, 2, 3, 4, 5]
frutas = ["maçã", "banana", "laranja"]
mista = [1, "texto", 3.14, True]
\`\`\`

## Acessando elementos

\`\`\`python
frutas = ["maçã", "banana", "laranja", "uva"]

print(frutas[0])    # "maçã" (primeiro)
print(frutas[-1])   # "uva" (último)
print(frutas[1:3])  # ["banana", "laranja"] (fatiamento)
\`\`\`

## Modificando listas

\`\`\`python
numeros = [1, 2, 3]

# Alterar elemento
numeros[0] = 10
print(numeros)  # [10, 2, 3]

# Adicionar no final
numeros.append(4)
print(numeros)  # [10, 2, 3, 4]

# Inserir em posição
numeros.insert(1, 15)
print(numeros)  # [10, 15, 2, 3, 4]

# Remover por valor
numeros.remove(2)
print(numeros)  # [10, 15, 3, 4]

# Remover por índice
del numeros[0]
print(numeros)  # [15, 3, 4]

# Remover e retornar
ultimo = numeros.pop()
print(ultimo)   # 4
print(numeros)  # [15, 3]
\`\`\`

## Métodos úteis

\`\`\`python
numeros = [3, 1, 4, 1, 5, 9, 2]

# Tamanho
print(len(numeros))  # 7

# Ordenar
numeros.sort()
print(numeros)  # [1, 1, 2, 3, 4, 5, 9]

# Reverter
numeros.reverse()
print(numeros)  # [9, 5, 4, 3, 2, 1, 1]

# Contar ocorrências
print(numeros.count(1))  # 2

# Buscar índice
print(numeros.index(4))  # 2

# Limpar lista
numeros.clear()
print(numeros)  # []
\`\`\`

## List comprehension

\`\`\`python
# Criar lista com loop
quadrados = [x**2 for x in range(10)]
print(quadrados)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Com condição
pares = [x for x in range(20) if x % 2 == 0]
print(pares)  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Dicionários',
        slug: 'dicionarios',
        description: 'Estruturas chave-valor.',
        type: 'text' as const,
        isFree: false,
        order: 2,
        sections: [
          {
            title: 'Trabalhando com dicionários',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Dicionários em Python

## Criando dicionários

\`\`\`python
# Dicionário vazio
dicionario = {}
dicionario = dict()

# Com dados
pessoa = {
    "nome": "Maria",
    "idade": 25,
    "cidade": "São Paulo"
}
\`\`\`

## Acessando valores

\`\`\`python
pessoa = {"nome": "João", "idade": 30}

# Com colchetes
print(pessoa["nome"])  # "João"

# Com get() (mais seguro)
print(pessoa.get("idade"))       # 30
print(pessoa.get("email"))       # None
print(pessoa.get("email", "N/A"))  # "N/A" (valor padrão)
\`\`\`

## Modificando dicionários

\`\`\`python
pessoa = {"nome": "Ana", "idade": 28}

# Alterar valor
pessoa["idade"] = 29

# Adicionar chave
pessoa["email"] = "ana@example.com"

# Remover chave
del pessoa["idade"]

# Remover e retornar
email = pessoa.pop("email")
\`\`\`

## Métodos úteis

\`\`\`python
pessoa = {"nome": "Carlos", "idade": 35, "cidade": "Rio"}

# Todas as chaves
print(pessoa.keys())    # dict_keys(['nome', 'idade', 'cidade'])

# Todos os valores
print(pessoa.values())  # dict_values(['Carlos', 35, 'Rio'])

# Pares chave-valor
print(pessoa.items())   # dict_items([('nome', 'Carlos'), ...])

# Iterar
for chave, valor in pessoa.items():
    print(f"{chave}: {valor}")
\`\`\`

## Dict comprehension

\`\`\`python
# Criar dicionário com comprehension
quadrados = {x: x**2 for x in range(5)}
print(quadrados)  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
\`\`\``,
            },
          },
        ],
      },
      {
        title: 'Tuplas e Sets',
        slug: 'tuplas-sets',
        description: 'Tuplas imutáveis e conjuntos únicos.',
        type: 'text' as const,
        isFree: false,
        order: 3,
        sections: [
          {
            title: 'Tuplas e Sets',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Tuplas e Sets

## Tuplas (imutáveis)

\`\`\`python
# Criar tupla
coordenadas = (10, 20)
pessoa = ("João", 30, "São Paulo")

# Tupla de um elemento (precisa da vírgula)
tupla = (42,)

# Acessar elementos
print(coordenadas[0])  # 10
print(pessoa[-1])      # "São Paulo"

# Desempacotamento
x, y = coordenadas
nome, idade, cidade = pessoa

# Tuplas são imutáveis
# coordenadas[0] = 15  # ERRO!
\`\`\`

## Sets (conjuntos)

\`\`\`python
# Criar set
numeros = {1, 2, 3, 4, 5}
vogais = set("aeiou")

# Sets não têm ordem e não permitem duplicatas
print({1, 2, 2, 3})  # {1, 2, 3}

# Adicionar elemento
numeros.add(6)

# Remover elemento
numeros.remove(1)    # Erro se não existir
numeros.discard(10)  # Não dá erro

# Operações de conjunto
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)  # União: {1, 2, 3, 4, 5, 6}
print(a & b)  # Interseção: {3, 4}
print(a - b)  # Diferença: {1, 2}
print(a ^ b)  # Simétrica: {1, 2, 5, 6}
\`\`\``,
            },
          },
        ],
      },
    ],
  },
  {
    title: 'Módulos e Pacotes',
    description: 'Organizar código em módulos reutilizáveis.',
    order: 6,
    lessons: [
      {
        title: 'Importando e Criando Módulos',
        slug: 'modulos',
        description: 'Trabalhar com módulos Python.',
        type: 'text' as const,
        isFree: false,
        order: 1,
        sections: [
          {
            title: 'Usando módulos',
            contentType: 'text' as const,
            order: 1,
            content: {
              body: `# Módulos em Python

## Importando módulos

\`\`\`python
# Importar módulo completo
import math
print(math.pi)        # 3.141592653589793
print(math.sqrt(16))  # 4.0

# Importar com alias
import math as m
print(m.pi)

# Importar funções específicas
from math import pi, sqrt
print(pi)
print(sqrt(16))

# Importar tudo (não recomendado)
from math import *
\`\`\`

## Módulos úteis da biblioteca padrão

\`\`\`python
# random - números aleatórios
import random
print(random.randint(1, 10))    # Inteiro aleatório
print(random.choice([1,2,3]))   # Escolhe elemento
random.shuffle([1, 2, 3])       # Embaralha lista

# datetime - datas e horas
from datetime import datetime, date
agora = datetime.now()
hoje = date.today()

# os - sistema operacional
import os
print(os.getcwd())     # Diretório atual
os.mkdir("nova_pasta") # Criar pasta

# sys - sistema Python
import sys
print(sys.version)     # Versão do Python
\`\`\`

## Criando seus próprios módulos

Crie um arquivo \`calculadora.py\`:

\`\`\`python
# calculadora.py
def somar(a, b):
    return a + b

def subtrair(a, b):
    return a - b

PI = 3.14159
\`\`\`

Use em outro arquivo:

\`\`\`python
# main.py
import calculadora

resultado = calculadora.somar(10, 5)
print(resultado)  # 15
print(calculadora.PI)  # 3.14159
\`\`\`

## Pacotes

Estrutura de pastas:

\`\`\`
meu_projeto/
├── main.py
└── matematica/
    ├── __init__.py
    ├── basico.py
    └── avancado.py
\`\`\`

\`\`\`python
# main.py
from matematica import basico
from matematica.avancado import calcular_raiz

basico.somar(1, 2)
calcular_raiz(16)
\`\`\``,
            },
          },
        ],
      },
    ],
  },
];

/**
 * Seed function: create Python Essencial course with modules, lessons and sections
 * Idempotent — skips if the course already exists.
 */
export async function seedPythonCourse(): Promise<void> {
  const db = getDatabase();
  const now = new Date();

  // 1. Find admin user (instructor)
  const adminResult = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, 'ricardo@maroquio.com'))
    .limit(1);

  if (adminResult.length === 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  ⚠ Admin user not found. Run seedAdminUser first.');
    return;
  }
  const instructorId = adminResult[0]!.id;

  // 2. Create / find category "Programação"
  let categoryId: string;
  const existingCategory = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, 'programacao'))
    .limit(1);

  if (existingCategory.length > 0) {
    categoryId = existingCategory[0]!.id;
  } else {
    categoryId = uuidv7();
    await db.insert(categoriesTable).values({
      id: categoryId,
      name: 'Programação',
      slug: 'programacao',
      description: 'Linguagens de programação e desenvolvimento de software',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3. Check if course already exists
  const existingCourse = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, 'python-essencial'))
    .limit(1);

  if (existingCourse.length > 0) {
    if (env.NODE_ENV !== 'test')
      console.log('  → Course "Python Essencial" already exists');
    return;
  }

  // 4. Create course
  const courseId = uuidv7();
  await db.insert(coursesTable).values({
    id: courseId,
    title: 'Python Essencial',
    slug: 'python-essencial',
    description:
      'Domine Python do zero ao avançado com lições práticas e objetivas. Aprenda programação de forma clara, desde os fundamentos até estruturas de dados e programação orientada a objetos.',
    shortDescription: 'Aprenda Python do zero com lições práticas e objetivas',
    level: 'beginner',
    tags: ['python', 'programação', 'backend', 'data science', 'automação'],
    status: 'published',
    price: 0,
    currency: 'BRL',
    categoryId,
    instructorId,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  });

  // 5. Create modules → lessons → sections
  for (const moduleData of MODULES_DATA) {
    if (!moduleData) continue;
    const moduleId = uuidv7();
    await db.insert(modulesTable).values({
      id: moduleId,
      courseId,
      title: moduleData.title,
      description: moduleData.description,
      order: moduleData.order,
      createdAt: now,
      updatedAt: now,
    });

    for (const lessonData of moduleData.lessons) {
      const lessonId = uuidv7();
      await db.insert(lessonsTable).values({
        id: lessonId,
        moduleId,
        title: lessonData.title,
        slug: lessonData.slug,
        description: lessonData.description,
        type: lessonData.type,
        isFree: lessonData.isFree,
        order: lessonData.order,
        createdAt: now,
        updatedAt: now,
      });

      for (const sectionData of lessonData.sections) {
        await db.insert(sectionsTable).values({
          id: uuidv7(),
          lessonId,
          title: sectionData.title,
          contentType: sectionData.contentType,
          content: sectionData.content,
          order: sectionData.order,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  if (env.NODE_ENV !== 'test')
    console.log('  ✓ Course "Python Essencial" seeded with all modules, lessons and sections.');
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (import.meta.main) {
  console.log('Seeding Python course...');
  seedPythonCourse()
    .then(() => {
      console.log('Python course seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed Python course:', error);
      process.exit(1);
    });
}
