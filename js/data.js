/* Inhalte der App: Themen, Wörter und Sätze.
   Neue Themen einfach in THEMES ergänzen (kind: "words" oder "sentences"). */
const NUM_EN=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const NUM_DE=['eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'];
const W=(en,de,e)=>({en,de,e});
const S=(en,de,e)=>({en,de,e,s:true});

const THEMES=[
  {id:'animals',kind:'words',name:'Tiere',icon:'🐾',color:'var(--grass)',items:[
    W('dog','Hund','🐶'),W('cat','Katze','🐱'),W('bird','Vogel','🐦'),W('fish','Fisch','🐟'),
    W('horse','Pferd','🐴'),W('cow','Kuh','🐮'),W('pig','Schwein','🐷'),W('rabbit','Hase','🐰'),
    W('mouse','Maus','🐭'),W('lion','Löwe','🦁'),W('elephant','Elefant','🐘'),W('monkey','Affe','🐵'),
    W('duck','Ente','🦆'),W('frog','Frosch','🐸')
  ]},
  {id:'colors',kind:'words',name:'Farben',icon:'🎨',color:'var(--berry)',items:[
    {en:'red',de:'rot',c:'#E53935'},{en:'blue',de:'blau',c:'#1E88E5'},{en:'green',de:'grün',c:'#43A047'},
    {en:'yellow',de:'gelb',c:'#FDD835'},{en:'orange',de:'orange',c:'#FB8C00'},{en:'purple',de:'violett',c:'#8E24AA'},
    {en:'pink',de:'rosa',c:'#F48FB1'},{en:'brown',de:'braun',c:'#795548'},{en:'black',de:'schwarz',c:'#212121'},
    {en:'white',de:'weiss',c:'#FFFFFF'},{en:'grey',de:'grau',c:'#9E9E9E'}
  ]},
  {id:'numbers',kind:'words',name:'Zahlen 1–20',icon:'🔢',color:'var(--sky)',items:NUM_EN.map((en,i)=>({en,de:NUM_DE[i],n:i+1}))},
  {id:'family',kind:'words',name:'Familie',icon:'🏠',color:'var(--tang)',items:[
    W('mother','Mutter','👩'),W('father','Vater','👨'),W('sister','Schwester','👧'),W('brother','Bruder','👦'),
    W('baby','Baby','👶'),W('grandma','Grossmutter','👵'),W('grandpa','Grossvater','👴'),W('family','Familie','👨‍👩‍👧')
  ]},
  {id:'body',kind:'words',name:'Körper',icon:'✋',color:'var(--grape)',items:[
    W('eye','Auge','👁️'),W('ear','Ohr','👂'),W('nose','Nase','👃'),W('mouth','Mund','👄'),
    W('hand','Hand','✋'),W('arm','Arm','💪'),W('leg','Bein','🦵'),W('foot','Fuss','🦶'),W('tooth','Zahn','🦷')
  ]},
  {id:'clothes',kind:'words',name:'Kleider',icon:'👕',color:'var(--sky)',items:[
    W('T-shirt','T-Shirt','👕'),W('trousers','Hose','👖'),W('dress','Kleid','👗'),W('shoes','Schuhe','👟'),
    W('socks','Socken','🧦'),W('jacket','Jacke','🧥'),W('cap','Kappe','🧢'),W('scarf','Schal','🧣'),W('gloves','Handschuhe','🧤')
  ]},
  {id:'food',kind:'words',name:'Essen & Trinken',icon:'🍎',color:'var(--berry)',items:[
    W('apple','Apfel','🍎'),W('banana','Banane','🍌'),W('strawberry','Erdbeere','🍓'),W('carrot','Karotte','🥕'),
    W('bread','Brot','🍞'),W('cheese','Käse','🧀'),W('egg','Ei','🥚'),W('pizza','Pizza','🍕'),
    W('cake','Kuchen','🍰'),W('ice cream','Glace','🍦'),W('milk','Milch','🥛'),W('water','Wasser','💧')
  ]},
  {id:'school',kind:'words',name:'Schule',icon:'🎒',color:'var(--grass)',items:[
    W('school','Schule','🏫'),W('teacher','Lehrerin','👩‍🏫'),W('book','Buch','📕'),W('pencil','Bleistift','✏️'),
    W('crayon','Farbstift','🖍️'),W('scissors','Schere','✂️'),W('ruler','Lineal','📏'),W('school bag','Schultasche','🎒'),W('clock','Uhr','🕒')
  ]},
  {id:'toys',kind:'words',name:'Spielsachen',icon:'🧸',color:'var(--tang)',items:[
    W('ball','Ball','⚽'),W('teddy bear','Teddybär','🧸'),W('car','Auto','🚗'),W('bike','Velo','🚲'),
    W('kite','Drachen','🪁'),W('puzzle','Puzzle','🧩'),W('balloon','Ballon','🎈'),W('robot','Roboter','🤖'),W('dice','Würfel','🎲')
  ]},

  {id:'s-hello',kind:'sentences',name:'Hallo & wie geht\'s?',icon:'👋',color:'var(--sun)',items:[
    S('Hello!','Hallo!','👋'),S('Good morning!','Guten Morgen!','🌅'),S('Good night!','Gute Nacht!','🌙'),
    S('Thank you!','Danke!','🙏'),S('I am happy.','Ich bin fröhlich.','😊'),S('I am sad.','Ich bin traurig.','😢'),
    S('I am tired.','Ich bin müde.','😴'),S('I am hungry.','Ich habe Hunger.','😋')
  ]},
  {id:'s-like',kind:'sentences',name:'I like …',icon:'❤️',color:'var(--berry)',items:[
    S('I like apples.','Ich mag Äpfel.','❤️🍎'),S('I like dogs.','Ich mag Hunde.','❤️🐶'),
    S('I like pizza.','Ich mag Pizza.','❤️🍕'),S('I like ice cream.','Ich mag Glace.','❤️🍦'),
    S('I like football.','Ich mag Fussball.','❤️⚽'),S('I don\'t like carrots.','Ich mag keine Karotten.','👎🥕'),
    S('I don\'t like spiders.','Ich mag keine Spinnen.','👎🕷️'),S('I don\'t like rain.','Ich mag keinen Regen.','👎🌧️')
  ]},
  {id:'s-have',kind:'sentences',name:'I have …',icon:'🤲',color:'var(--grass)',items:[
    S('I have a dog.','Ich habe einen Hund.','🐶'),S('I have a cat.','Ich habe eine Katze.','🐱'),
    S('I have a bike.','Ich habe ein Velo.','🚲'),S('I have a sister.','Ich habe eine Schwester.','👧'),
    S('I have two brothers.','Ich habe zwei Brüder.','👦👦'),S('I have three balloons.','Ich habe drei Ballone.','🎈🎈🎈'),
    S('I have a teddy bear.','Ich habe einen Teddybär.','🧸')
  ]},
  {id:'s-is',kind:'sentences',name:'The … is …',icon:'🔍',color:'var(--sky)',items:[
    S('The apple is red.','Der Apfel ist rot.','🍎'),S('The banana is yellow.','Die Banane ist gelb.','🍌'),
    S('The frog is green.','Der Frosch ist grün.','🐸'),S('The elephant is big.','Der Elefant ist gross.','🐘'),
    S('The mouse is small.','Die Maus ist klein.','🐭'),S('The ice cream is cold.','Die Glace ist kalt.','🍦❄️'),
    S('The sun is hot.','Die Sonne ist heiss.','☀️🔥')
  ]}
];
