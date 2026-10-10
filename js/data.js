/* Inhalte der App: Levels, Themen, Wörter und Sätze.
   Neue Themen einfach in THEMES ergänzen (kind: "words" oder "sentences", level: 1–4). */
const LEVELS=[
  {n:1,icon:'🌱',name:'Level 1',sub:'Erste Wörter'},
  {n:2,icon:'🌿',name:'Level 2',sub:'Mein Alltag'},
  {n:3,icon:'🌳',name:'Level 3',sub:'Die Welt um mich'},
  {n:4,icon:'🏆',name:'Level 4',sub:'Reden und fragen'}
];

/* Sticker-Album: Sticker mit Sternen freischalten (cost). Spezial-Sticker gibt es für bestandene Level-Tests.
   Bestehende Emojis nicht ändern: daran hängt der Spielstand. */
const STICKER_PACKS=[
  {name:'Tierfreunde',cost:5,items:[['🦊','Fuchs'],['🐼','Panda'],['🐨','Koala'],['🦔','Igel'],['🐙','Krake'],['🦋','Schmetterling'],['🐢','Schildkröte'],['🦉','Eule']]},
  {name:'Unterwegs',cost:8,items:[['🏎️','Rennauto'],['🚂','Dampflok'],['🛸','Ufo'],['🚤','Schnellboot'],['🛶','Kanu'],['🏍️','Motorrad'],['🪂','Fallschirm'],['🚡','Gondel']]},
  {name:'Leckereien',cost:10,items:[['🍩','Donut'],['🧁','Cupcake'],['🍉','Wassermelone'],['🥨','Brezel'],['🍿','Popcorn'],['🍭','Lolli'],['🥞','Pfannkuchen'],['🍪','Guetzli']]},
  {name:'Fantasie',cost:15,items:[['🧚','Fee'],['🦖','Dino'],['🧜‍♀️','Meerjungfrau'],['🤖','Roboter'],['👽','Ausserirdischer'],['🧙','Zauberer'],['🐲','Drache'],['👻','Gespenst']]}
];
const LEVEL_STICKERS={1:['🦄','Einhorn'],2:['🌈','Regenbogen'],3:['🐉','Glücksdrache'],4:['👑','Krone']};
const NUM_EN=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const NUM_DE=['eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'];
const W=(en,de,e)=>({en,de,e});
const S=(en,de,e)=>({en,de,e,s:true});

const THEMES=[
  {id:'animals',level:1,kind:'words',name:'Tiere',icon:'🐾',color:'var(--grass)',items:[
    W('dog','Hund','🐶'),W('cat','Katze','🐱'),W('bird','Vogel','🐦'),W('fish','Fisch','🐟'),
    W('horse','Pferd','🐴'),W('cow','Kuh','🐮'),W('pig','Schwein','🐷'),W('rabbit','Hase','🐰'),
    W('mouse','Maus','🐭'),W('lion','Löwe','🦁'),W('elephant','Elefant','🐘'),W('monkey','Affe','🐵'),
    W('duck','Ente','🦆'),W('frog','Frosch','🐸'),W('sheep','Schaf','🐑'),W('goat','Ziege','🐐'),
    W('chicken','Huhn','🐔'),W('bee','Biene','🐝'),W('snail','Schnecke','🐌')
  ]},
  {id:'colors',level:1,kind:'words',name:'Farben',icon:'🎨',color:'var(--berry)',items:[
    {en:'red',de:'rot',c:'#E53935'},{en:'blue',de:'blau',c:'#1E88E5'},{en:'green',de:'grün',c:'#43A047'},
    {en:'yellow',de:'gelb',c:'#FDD835'},{en:'orange',de:'orange',c:'#FB8C00'},{en:'purple',de:'violett',c:'#8E24AA'},
    {en:'pink',de:'rosa',c:'#F48FB1'},{en:'brown',de:'braun',c:'#795548'},{en:'black',de:'schwarz',c:'#212121'},
    {en:'white',de:'weiss',c:'#FFFFFF'},{en:'grey',de:'grau',c:'#9E9E9E'}
  ]},
  {id:'numbers',level:1,kind:'words',name:'Zahlen 1–20',icon:'🔢',color:'var(--sky)',items:NUM_EN.map((en,i)=>({en,de:NUM_DE[i],n:i+1}))},
  {id:'family',level:1,kind:'words',name:'Familie',icon:'🏠',color:'var(--tang)',items:[
    W('mother','Mutter','👩'),W('father','Vater','👨'),W('sister','Schwester','👧'),W('brother','Bruder','👦'),
    W('baby','Baby','👶'),W('grandma','Grossmutter','👵'),W('grandpa','Grossvater','👴'),W('family','Familie','👨‍👩‍👧')
  ]},
  {id:'body',level:2,kind:'words',name:'Körper',icon:'✋',color:'var(--grape)',items:[
    W('eye','Auge','👁️'),W('ear','Ohr','👂'),W('nose','Nase','👃'),W('mouth','Mund','👄'),
    W('hand','Hand','✋'),W('arm','Arm','💪'),W('leg','Bein','🦵'),W('foot','Fuss','🦶'),W('tooth','Zahn','🦷'),
    W('finger','Finger','👆'),W('tongue','Zunge','👅')
  ]},
  {id:'clothes',level:2,kind:'words',name:'Kleider',icon:'👕',color:'var(--sky)',items:[
    W('T-shirt','T-Shirt','👕'),W('trousers','Hose','👖'),W('dress','Kleid','👗'),W('shoes','Schuhe','👟'),
    W('socks','Socken','🧦'),W('jacket','Jacke','🧥'),W('cap','Kappe','🧢'),W('scarf','Schal','🧣'),W('gloves','Handschuhe','🧤'),
    W('hat','Hut','👒'),W('boots','Stiefel','👢'),W('swimsuit','Badeanzug','🩱')
  ]},
  {id:'food',level:2,kind:'words',name:'Essen & Trinken',icon:'🍎',color:'var(--berry)',items:[
    W('apple','Apfel','🍎'),W('banana','Banane','🍌'),W('strawberry','Erdbeere','🍓'),W('carrot','Karotte','🥕'),
    W('bread','Brot','🍞'),W('cheese','Käse','🧀'),W('egg','Ei','🥚'),W('pizza','Pizza','🍕'),
    W('cake','Kuchen','🍰'),W('ice cream','Glace','🍦'),W('milk','Milch','🥛'),W('water','Wasser','💧'),
    W('orange','Orange','🍊'),W('tomato','Tomate','🍅'),W('potato','Kartoffel','🥔'),W('chocolate','Schokolade','🍫'),W('sandwich','Sandwich','🥪')
  ]},
  {id:'school',level:3,kind:'words',name:'Schule',icon:'🎒',color:'var(--grass)',items:[
    W('school','Schule','🏫'),W('teacher','Lehrerin','👩‍🏫'),W('book','Buch','📕'),W('pencil','Bleistift','✏️'),
    W('crayon','Farbstift','🖍️'),W('scissors','Schere','✂️'),W('ruler','Lineal','📏'),W('school bag','Schultasche','🎒'),W('clock','Uhr','🕒'),
    W('computer','Computer','💻'),W('notebook','Heft','📓'),W('glue','Leim','🧴')
  ]},
  {id:'toys',level:2,kind:'words',name:'Spielsachen',icon:'🧸',color:'var(--tang)',items:[
    W('ball','Ball','⚽'),W('teddy bear','Teddybär','🧸'),W('car','Auto','🚗'),W('bike','Velo','🚲'),
    W('kite','Drachen','🪁'),W('puzzle','Puzzle','🧩'),W('balloon','Ballon','🎈'),W('robot','Roboter','🤖'),W('dice','Würfel','🎲'),
    W('doll','Puppe','🪆'),W('yo-yo','Jo-Jo','🪀'),W('blocks','Bauklötze','🧱')
  ]},
  {id:'shapes',level:1,kind:'words',name:'Formen',icon:'🔺',color:'var(--grape)',items:[
    W('circle','Kreis','⚪'),W('square','Quadrat','🟥'),W('triangle','Dreieck','🔺'),W('star','Stern','⭐'),
    W('heart','Herz','❤️'),W('diamond','Raute','🔷'),W('moon','Mond','🌙')
  ]},
  {id:'house',level:2,kind:'words',name:'Zuhause',icon:'🏡',color:'var(--tang)',items:[
    W('house','Haus','🏠'),W('door','Tür','🚪'),W('window','Fenster','🪟'),W('bed','Bett','🛏️'),
    W('chair','Stuhl','🪑'),W('sofa','Sofa','🛋️'),W('bath','Badewanne','🛁'),W('toilet','WC','🚽'),
    W('lamp','Lampe','💡'),W('key','Schlüssel','🔑')
  ]},
  {id:'transport',level:2,kind:'words',name:'Unterwegs',icon:'🚌',color:'var(--sky)',items:[
    W('bus','Bus','🚌'),W('train','Zug','🚆'),W('plane','Flugzeug','✈️'),W('boat','Schiff','⛵'),
    W('tractor','Traktor','🚜'),W('helicopter','Helikopter','🚁'),W('rocket','Rakete','🚀'),W('taxi','Taxi','🚕'),
    W('scooter','Trottinett','🛴'),W('fire engine','Feuerwehrauto','🚒')
  ]},
  {id:'weather',level:3,kind:'words',name:'Wetter',icon:'🌦️',color:'var(--sky)',items:[
    W('sun','Sonne','☀️'),W('rain','Regen','🌧️'),W('snow','Schnee','❄️'),W('wind','Wind','💨'),
    W('cloud','Wolke','☁️'),W('rainbow','Regenbogen','🌈'),W('lightning','Blitz','⚡'),W('umbrella','Regenschirm','☂️'),
    W('snowman','Schneemann','⛄')
  ]},
  {id:'days',level:3,kind:'words',name:'Wochentage',icon:'📅',color:'var(--grape)',items:[
    {en:'Monday',de:'Montag',t:'Mo'},{en:'Tuesday',de:'Dienstag',t:'Di'},{en:'Wednesday',de:'Mittwoch',t:'Mi'},
    {en:'Thursday',de:'Donnerstag',t:'Do'},{en:'Friday',de:'Freitag',t:'Fr'},{en:'Saturday',de:'Samstag',t:'Sa'},
    {en:'Sunday',de:'Sonntag',t:'So'}
  ]},
  {id:'feelings',level:3,kind:'words',name:'Gefühle',icon:'😊',color:'var(--sun)',items:[
    W('happy','fröhlich','😊'),W('sad','traurig','😢'),W('angry','wütend','😠'),W('scared','ängstlich','😨'),
    W('tired','müde','😴'),W('surprised','überrascht','😲'),W('sick','krank','🤒'),W('silly','albern','🤪')
  ]},
  {id:'zoo',level:3,kind:'words',name:'Im Zoo',icon:'🦒',color:'var(--grass)',items:[
    W('giraffe','Giraffe','🦒'),W('zebra','Zebra','🦓'),W('tiger','Tiger','🐯'),W('bear','Bär','🐻'),
    W('penguin','Pinguin','🐧'),W('crocodile','Krokodil','🐊'),W('snake','Schlange','🐍'),W('kangaroo','Känguru','🦘'),
    W('hippo','Nilpferd','🦛'),W('parrot','Papagei','🦜')
  ]},
  {id:'nature',level:3,kind:'words',name:'Natur',icon:'🌳',color:'var(--grass)',items:[
    W('tree','Baum','🌳'),W('flower','Blume','🌸'),W('mountain','Berg','⛰️'),W('lake','See','🏞️'),
    W('sea','Meer','🌊'),W('leaf','Blatt','🍃'),W('stone','Stein','🪨'),W('beach','Strand','🏖️'),
    W('mushroom','Pilz','🍄'),W('fire','Feuer','🔥')
  ]},
  {id:'sports',level:3,kind:'words',name:'Sport',icon:'⚽',color:'var(--berry)',items:[
    W('football','Fussball','⚽'),W('tennis','Tennis','🎾'),W('basketball','Basketball','🏀'),W('skiing','Skifahren','⛷️'),
    W('swimming','Schwimmen','🏊'),W('cycling','Velofahren','🚴'),W('ice hockey','Eishockey','🏒'),W('volleyball','Volleyball','🏐')
  ]},
  {id:'months',level:4,kind:'words',name:'Monate',icon:'🗓️',color:'var(--tang)',items:[
    {en:'January',de:'Januar',t:'Jan'},{en:'February',de:'Februar',t:'Feb'},{en:'March',de:'März',t:'Mär'},
    {en:'April',de:'April',t:'Apr'},{en:'May',de:'Mai',t:'Mai'},{en:'June',de:'Juni',t:'Jun'},
    {en:'July',de:'Juli',t:'Jul'},{en:'August',de:'August',t:'Aug'},{en:'September',de:'September',t:'Sep'},
    {en:'October',de:'Oktober',t:'Okt'},{en:'November',de:'November',t:'Nov'},{en:'December',de:'Dezember',t:'Dez'}
  ]},

  {id:'s-hello',level:1,kind:'sentences',name:'Hallo & wie geht\'s?',icon:'👋',color:'var(--sun)',items:[
    S('Hello!','Hallo!','👋'),S('Good morning!','Guten Morgen!','🌅'),S('Good night!','Gute Nacht!','🌙'),
    S('Thank you!','Danke!','🙏'),S('I am happy.','Ich bin fröhlich.','😊'),S('I am sad.','Ich bin traurig.','😢'),
    S('I am tired.','Ich bin müde.','😴'),S('I am hungry.','Ich habe Hunger.','😋')
  ]},
  {id:'s-like',level:2,kind:'sentences',name:'I like …',icon:'❤️',color:'var(--berry)',items:[
    S('I like apples.','Ich mag Äpfel.','❤️🍎'),S('I like dogs.','Ich mag Hunde.','❤️🐶'),
    S('I like pizza.','Ich mag Pizza.','❤️🍕'),S('I like ice cream.','Ich mag Glace.','❤️🍦'),
    S('I like football.','Ich mag Fussball.','❤️⚽'),S('I don\'t like carrots.','Ich mag keine Karotten.','👎🥕'),
    S('I don\'t like spiders.','Ich mag keine Spinnen.','👎🕷️'),S('I don\'t like rain.','Ich mag keinen Regen.','👎🌧️')
  ]},
  {id:'s-have',level:2,kind:'sentences',name:'I have …',icon:'🤲',color:'var(--grass)',items:[
    S('I have a dog.','Ich habe einen Hund.','🐶'),S('I have a cat.','Ich habe eine Katze.','🐱'),
    S('I have a bike.','Ich habe ein Velo.','🚲'),S('I have a sister.','Ich habe eine Schwester.','👧'),
    S('I have two brothers.','Ich habe zwei Brüder.','👦👦'),S('I have three balloons.','Ich habe drei Ballone.','🎈🎈🎈'),
    S('I have a teddy bear.','Ich habe einen Teddybär.','🧸')
  ]},
  {id:'s-is',level:3,kind:'sentences',name:'The … is …',icon:'🔍',color:'var(--sky)',items:[
    S('The apple is red.','Der Apfel ist rot.','🍎'),S('The banana is yellow.','Die Banane ist gelb.','🍌'),
    S('The frog is green.','Der Frosch ist grün.','🐸'),S('The elephant is big.','Der Elefant ist gross.','🐘'),
    S('The mouse is small.','Die Maus ist klein.','🐭'),S('The ice cream is cold.','Die Glace ist kalt.','🍦❄️'),
    S('The sun is hot.','Die Sonne ist heiss.','☀️🔥')
  ]},
  {id:'s-can',level:3,kind:'sentences',name:'I can …',icon:'💪',color:'var(--tang)',items:[
    S('I can run.','Ich kann rennen.','🏃'),S('I can swim.','Ich kann schwimmen.','🏊'),
    S('I can sing.','Ich kann singen.','🎤'),S('I can dance.','Ich kann tanzen.','💃'),
    S('I can read.','Ich kann lesen.','📖'),S('I can draw.','Ich kann zeichnen.','🎨'),
    S('I can ride a bike.','Ich kann Velo fahren.','🚴'),S('I can climb.','Ich kann klettern.','🧗')
  ]},
  {id:'s-time',level:4,kind:'sentences',name:'Wie spät ist es?',icon:'🕒',color:'var(--grass)',items:[
    S('It\'s one o\'clock.','Es ist ein Uhr.','🕐'),S('It\'s three o\'clock.','Es ist drei Uhr.','🕒'),
    S('It\'s five o\'clock.','Es ist fünf Uhr.','🕔'),S('It\'s six o\'clock.','Es ist sechs Uhr.','🕕'),
    S('It\'s eight o\'clock.','Es ist acht Uhr.','🕗'),S('It\'s nine o\'clock.','Es ist neun Uhr.','🕘'),
    S('It\'s twelve o\'clock.','Es ist zwölf Uhr.','🕛')
  ]},
  {id:'s-ask',level:4,kind:'sentences',name:'Fragen',icon:'❓',color:'var(--berry)',items:[
    S('Where is the cat?','Wo ist die Katze?','❓🐱'),S('Where is my ball?','Wo ist mein Ball?','❓⚽'),
    S('Where is Mum?','Wo ist Mama?','❓👩'),S('What is your name?','Wie heisst du?','📛❓'),
    S('How old are you?','Wie alt bist du?','🎂❓'),S('Can I have an apple, please?','Kann ich bitte einen Apfel haben?','🙋🍎'),
    S('Can I have some water, please?','Kann ich bitte Wasser haben?','🙋💧'),S('Can I have an ice cream, please?','Kann ich bitte eine Glace haben?','🙋🍦')
  ]},
  {id:'s-meet',level:4,kind:'sentences',name:'Kennenlernen',icon:'🤝',color:'var(--grape)',items:[
    S('My name is Tom.','Ich heisse Tom.','📛👦'),S('I am eight years old.','Ich bin acht Jahre alt.','🎂'),
    S('Nice to meet you!','Freut mich!','🤝'),S('Where do you live?','Wo wohnst du?','🏠❓'),
    S('I live in Switzerland.','Ich wohne in der Schweiz.','🇨🇭'),S('Do you have a pet?','Hast du ein Haustier?','🐾❓'),
    S('Yes, I have a dog.','Ja, ich habe einen Hund.','✅🐶'),S('See you tomorrow!','Bis morgen!','👋🌅')
  ]},
  {id:'s-day',level:3,kind:'sentences',name:'Mein Tag',icon:'⏰',color:'var(--sun)',items:[
    S('I wake up.','Ich wache auf.','⏰'),S('I brush my teeth.','Ich putze meine Zähne.','🪥'),
    S('I eat breakfast.','Ich esse Frühstück.','🥣'),S('I go to school.','Ich gehe in die Schule.','🏫'),
    S('I play with my friends.','Ich spiele mit meinen Freunden.','👫⚽'),S('I do my homework.','Ich mache meine Hausaufgaben.','📝'),
    S('I take a bath.','Ich nehme ein Bad.','🛁'),S('I go to bed.','Ich gehe ins Bett.','🛏️')
  ]},
  {id:'s-weather',level:4,kind:'sentences',name:'Wie ist das Wetter?',icon:'🌈',color:'var(--sky)',items:[
    S('It is sunny.','Es ist sonnig.','☀️'),S('It is raining.','Es regnet.','🌧️'),
    S('It is snowing.','Es schneit.','❄️'),S('It is windy.','Es ist windig.','💨'),
    S('It is cloudy.','Es ist bewölkt.','☁️'),S('It is cold.','Es ist kalt.','🥶'),
    S('It is hot.','Es ist heiss.','🥵'),S("What's the weather like?",'Wie ist das Wetter?','❓🌦️')
  ]}
];
