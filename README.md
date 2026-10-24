# Chá revelação virtual — raspadinha

Página estática e responsiva. O percurso é: envelope, mensagem, raspadinha e revelação. A revelação acontece ao descobrir três corações da cor vencedora alinhados na coluna da direita; não é preciso raspar todos os círculos.

## Personalizar

Edite somente [config.js](config.js) antes de publicar no Git:

```js
window.REVEAL_CONFIG = {
  nomeMae: 'Ana',
  nomePai: 'Vinícius',
  nomeBebe: 'Miguel',
  sexo: 'menino', // "menino" ou "menina"
  nomeAlternativo: '', // opcional: o outro nome mostrado na raspadinha
};
```

Quando `sexo` é `menino`, o nome do bebê aparece em azul; quando é `menina`, aparece em rosa. Se `nomeBebe` ficar vazio (`''`), a raspadinha mostra apenas **MENINA OU MENINO** e a tela final destaca somente o sexo, sem nome. Com um nome preenchido, `nomeAlternativo` pode ficar vazio para usar Maria ou Miguel como a outra opção. Esses valores são públicos para qualquer pessoa que veja o repositório ou o código da página, então não coloque informações sigilosas nesse arquivo.

## Abrir localmente

Na pasta do projeto, execute `python -m http.server 8010 --bind 127.0.0.1` e abra `http://127.0.0.1:8010` no navegador. Também é possível abrir `index.html` diretamente.

## Publicar no GitHub Pages

O workflow em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) valida o JavaScript e publica o site após cada push na branch `main`. A primeira publicação exige uma configuração no repositório do GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**. Depois, faça um push para `main` ou execute o workflow manualmente em **Actions**.

O endereço esperado é `https://talis-dev.github.io/raspadinha-revelacao-web/`. Confirme o endereço exibido pelo GitHub quando a publicação terminar. Como o repositório e o site são públicos, o conteúdo de `config.js`, inclusive o sexo do bebê, pode ser visto no código-fonte antes da raspagem.

Funciona com toque, mouse e caneta. Para usar teclado, foque um círculo e pressione Enter ou Espaço. O botão **Ver novamente** reinicia a experiência.

A melodia de fundo começa após o primeiro toque no envelope, conforme a política de áudio dos navegadores. Ela tem quatro frases suaves em estilo de canção de ninar e se repete enquanto a página está aberta. O botão com a nota musical pausa ou retoma o som. O efeito de raspagem toca enquanto o usuário esfrega os círculos. Ambos são sintetizados no navegador com Web Audio, sem baixar um arquivo de música.

As ilustrações transparentes e o fundo em `assets/` foram criados com a ferramenta integrada de geração de imagens. Briefs usados: ovelhinha bebê em aquarela pastel, lã marfim, expressão doce, isolada em fundo transparente; para a tela final, olhos fechados e nuvem azul clara; para o fundo, papel aquarelado claro com nuvens rosa e azul nas bordas, pequenas estrelas douradas e centro livre para leitura.
