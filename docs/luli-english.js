// English for 6th grade (האיזור של לולי). Built on the Israeli curriculum: level A1 (Basic User I),
// Lexical Band I (core I & II), and the task types of the national 6th-grade English exam (RAMA).
// All texts are original.

// Vocabulary, like the exam: [type, prompt, answer]. Wrong options are other answers of the same type.
//   pic = word for a picture · def = word for a definition · opp = opposite · fill = complete the sentence
window.LE_VOCAB = [
  ['pic', '🚑', 'ambulance'], ['pic', '🏖️', 'beach'], ['pic', '🚲', 'bicycle'], ['pic', '📷', 'camera'],
  ['pic', '🍞', 'bread'], ['pic', '🧀', 'cheese'], ['pic', '🦋', 'butterfly'], ['pic', '⌚', 'watch'],
  ['pic', '🔑', 'key'], ['pic', '🎸', 'guitar'], ['pic', '🏥', 'hospital'], ['pic', '✉️', 'letter'],
  ['pic', '🛏️', 'bed'], ['pic', '🌧️', 'rain'], ['pic', '❄️', 'snow'], ['pic', '👟', 'shoes'],
  ['def', 'the place where you borrow books', 'library'], ['def', 'the first meal of the day', 'breakfast'],
  ['def', 'the day after Friday', 'Saturday'], ['def', 'the season after summer', 'autumn'],
  ['def', 'a person who teaches at school', 'teacher'], ['def', 'you use them to cut paper', 'scissors'],
  ['def', 'a shop where you buy food', 'supermarket'], ['def', 'the month after March', 'April'],
  ['def', 'the room where you cook', 'kitchen'], ['def', 'a person you visit when you are sick', 'doctor'],
  ['def', 'a person who writes books', 'writer'], ['def', "your mother's mother", 'grandmother'],
  ['opp', 'hot', 'cold'], ['opp', 'big', 'small'], ['opp', 'happy', 'sad'], ['opp', 'fast', 'slow'],
  ['opp', 'early', 'late'], ['opp', 'open', 'closed'], ['opp', 'old (person)', 'young'], ['opp', 'buy', 'sell'],
  ['opp', 'remember', 'forget'], ['opp', 'easy', 'difficult'], ['opp', 'strong', 'weak'], ['opp', 'clean', 'dirty'],
  ['opp', 'empty', 'full'], ['opp', 'arrive', 'leave'],
  ['fill', 'I brush my ___ every morning.', 'teeth'], ['fill', "My mother's sister is my ___.", 'aunt'],
  ['fill', "It's raining. Take an ___.", 'umbrella'], ['fill', "I'm hungry. Can I have something to ___?", 'eat'],
  ['fill', 'The museum is open ___ Sunday to Thursday.', 'from'], ['fill', 'She is very good ___ math.', 'at'],
  ['fill', "Let's ___ the bus to school.", 'take'], ['fill', "What time is it? It's a ___ past five.", 'quarter'],
  ['fill', 'We ___ a lot of fun at the party yesterday.', 'had'], ['fill', 'There are seven days in a ___.', 'week'],
];
window.LE_VOCAB_HE = { pic: 'איזו מילה מתאימה לתמונה?', def: 'איזו מילה מתאימה להגדרה?', opp: 'מה ההפך?', fill: 'איזו מילה משלימה את המשפט?' };

// Past Simple: [base, past]. The first group is irregular, the second regular (with spelling changes).
window.LE_IRREGULAR = [
  ['go', 'went'], ['eat', 'ate'], ['see', 'saw'], ['have', 'had'], ['make', 'made'], ['take', 'took'], ['come', 'came'],
  ['give', 'gave'], ['write', 'wrote'], ['buy', 'bought'], ['bring', 'brought'], ['think', 'thought'], ['sleep', 'slept'],
  ['swim', 'swam'], ['drink', 'drank'], ['run', 'ran'], ['sit', 'sat'], ['get', 'got'], ['find', 'found'], ['fly', 'flew'],
  ['know', 'knew'], ['tell', 'told'], ['say', 'said'], ['begin', 'began'], ['do', 'did'], ['feel', 'felt'], ['leave', 'left'],
  ['meet', 'met'], ['send', 'sent'], ['sing', 'sang'], ['speak', 'spoke'], ['wear', 'wore'], ['win', 'won'], ['teach', 'taught'],
  ['catch', 'caught'], ['lose', 'lost'], ['read', 'read'], ['put', 'put'], ['draw', 'drew'], ['ride', 'rode'],
];
window.LE_REGULAR = [
  ['play', 'played'], ['study', 'studied'], ['stop', 'stopped'], ['like', 'liked'], ['try', 'tried'], ['plan', 'planned'],
  ['dance', 'danced'], ['cry', 'cried'], ['carry', 'carried'], ['visit', 'visited'], ['walk', 'walked'], ['open', 'opened'],
  ['jump', 'jumped'], ['live', 'lived'], ['clean', 'cleaned'], ['shop', 'shopped'],
];

// Grammar (A1): [topic, sentence with ___, right, [wrong, wrong], why (Hebrew)]
window.LE_TOPICS = { there: 'There is / are', was: 'Was / Were', comp: 'Comparatives', can: 'Can', wh: 'Wh- questions', pron: 'My / His / Her / Their', tense: 'Tenses', article: 'A / An / Plurals' };
window.LE_GRAMMAR = [
  ['there', 'There ___ a cat on the sofa.', 'is', ['are', 'am'], 'דבר אחד → There is'],
  ['there', 'There ___ many books in my bag.', 'are', ['is', 'be'], 'הרבה דברים → There are'],
  ['there', '___ there any milk in the fridge?', 'Is', ['Are', 'Do'], 'milk הוא דבר אחד (לא סופרים) → Is there'],
  ['was', 'Yesterday I ___ at home all day.', 'was', ['were', 'am'], 'עבר של am → was'],
  ['was', 'My friends ___ at the beach last Saturday.', 'were', ['was', 'are'], 'הרבה אנשים בעבר → were'],
  ['was', '___ you at school yesterday?', 'Were', ['Was', 'Did'], 'you בעבר → were'],
  ['comp', 'An elephant is ___ than a dog.', 'bigger', ['big', 'biggest'], 'השוואה בין שניים: than → er (big → bigger)'],
  ['comp', 'Today is the ___ day of the year!', 'hottest', ['hotter', 'hot'], 'הכי → the ...est'],
  ['comp', 'My bag is ___ than yours.', 'heavier', ['heavyer', 'more heavy'], 'y בסוף → ier (heavy → heavier)'],
  ['comp', 'This book is ___ than that one.', 'more interesting', ['interestinger', 'most interesting'], 'מילה ארוכה → more ... than'],
  ['comp', 'She is the ___ player in the team.', 'best', ['better', 'goodest'], 'good → better → the best'],
  ['can', "Fish ___ swim, but they can't walk.", 'can', ["can't", 'cans'], 'יכולת → can (בלי s)'],
  ['can', "I ___ ride a bike. I never learned how.", "can't", ['can', 'must'], 'אין יכולת → can\'t'],
  ['wh', '___ do you live? – In Haifa.', 'Where', ['When', 'Who'], 'מקום → Where'],
  ['wh', '___ is your birthday? – In May.', 'When', ['Where', 'What'], 'זמן → When'],
  ['wh', '___ is your teacher? – Mrs. Cohen.', 'Who', ['What', 'Where'], 'אדם → Who'],
  ['wh', "___ old are you? – I'm twelve.", 'How', ['What', 'Who'], 'גיל → How old'],
  ['wh', '___ do you go to school? – By bus.', 'How', ['What', 'Where'], 'איך (באיזו דרך) → How'],
  ['pron', 'This is Dana. ___ bag is red.', 'Her', ['His', 'She'], 'של בת → her'],
  ['pron', 'Tom and Ben are brothers. ___ house is near the park.', 'Their', ['There', 'They'], 'שלהם → their (there = שם)'],
  ['pron', 'This is my brother. ___ name is Omer.', 'His', ['Her', 'He'], 'של בן → his'],
  ['pron', 'I love ___ dog.', 'my', ['me', 'I'], 'שלי → my'],
  ['tense', 'We ___ to Eilat last summer.', 'went', ['go', 'goes'], 'last summer – עבר: go → went'],
  ['tense', 'She ___ TV every evening.', 'watches', ['watching', 'watch'], 'every evening – הרגל; she → watches'],
  ['tense', 'Look! The baby ___.', 'is sleeping', ['sleeps', 'sleep'], 'Look! – קורה עכשיו'],
  ['tense', "Look at those clouds! It ___ rain.", 'is going to', ['going to', 'will to'], 'רואים שזה עומד לקרות → is going to'],
  ['tense', 'Did you ___ your homework?', 'finish', ['finished', 'finishes'], 'אחרי did בא הפועל בצורת הבסיס'],
  ['article', 'I eat ___ apple every day.', 'an', ['a', 'two'], 'לפני צליל של תנועה (a, e, i, o, u) → an'],
  ['article', 'She has ___ new bike.', 'a', ['an', 'many'], 'new מתחיל בעיצור → a'],
  ['article', 'I have two ___.', 'children', ['childs', 'child'], 'child → children (רבים לא רגיל)'],
  ['article', 'There are five ___ on the table.', 'glasses', ['glass', 'glasss'], 'אחרי s מוסיפים es: glass → glasses'],
];

// Sentence builder (writing sentences): [Hebrew, English]
window.LE_SENTENCES = [
  ['קוראים לי נועה.', 'My name is Noa.'],
  ['אני בן שתים־עשרה.', 'I am twelve years old.'],
  ['אני גרה בחיפה.', 'I live in Haifa.'],
  ['יש לי שני אחים.', 'I have two brothers.'],
  ['הצבע האהוב עליי הוא כחול.', 'My favorite color is blue.'],
  ['אני אוהב לשחק כדורגל.', 'I like to play football.'],
  ['אתמול הלכנו לים.', 'Yesterday we went to the beach.'],
  ['יש חתול על השולחן.', 'There is a cat on the table.'],
  ['הכלב שלי גדול מהחתול שלך.', 'My dog is bigger than your cat.'],
  ['אני יכולה לשחות מהר.', 'I can swim fast.'],
  ['איפה אתה גר?', 'Where do you live?'],
  ['היא קוראת ספר עכשיו.', 'She is reading a book now.'],
  ['מחר אני הולך לבקר את סבתא שלי.', 'Tomorrow I am going to visit my grandmother.'],
  ['אנחנו לא הולכים לבית הספר בשבת.', 'We do not go to school on Saturday.'],
  ['מה השעה?', 'What time is it?'],
  ['אחותי בכיתה ג׳.', 'My sister is in third grade.'],
  ['התחביב שלי הוא ציור.', 'My hobby is drawing.'],
  ['אתה רוצה לבוא למסיבה שלי?', 'Do you want to come to my party?'],
];

// Reading (exam text types). q: mc (first option is right) or word (find a word in the text).
window.LE_READING = [
  {
    title: 'An email from Noa', type: 'Email',
    paras: [
      "Hi Maya, How are you? I'm writing to tell you about our class trip. Last Tuesday, my class went to the Jerusalem Zoo. We left school at eight o'clock in the morning and arrived at the zoo at ten.",
      "First, we saw the elephants. They were very big and they ate a lot of hay. Then we watched the monkeys. One monkey took a boy's hat and ran up a tree! Everybody laughed, and the zookeeper got the hat back.",
      'At twelve o\'clock we had lunch on the grass. My favorite animal was the penguin because it walks in a funny way. We came back to school at four. I was very tired, but it was the best trip of the year.',
      'Next month we are going to visit the Science Museum. Do you want to come with us? Write back soon, Noa',
    ],
    qs: [
      { t: 'mc', p: 1, q: 'Where did Noa\'s class go?', o: ['To the Jerusalem Zoo', 'To the Science Museum', 'To a park', 'To the beach'] },
      { t: 'mc', p: 2, q: 'In paragraph 2, "They were very big" – who were very big?', o: ['the elephants', 'the monkeys', 'the children', 'the zookeepers'] },
      { t: 'mc', p: 2, q: 'What did the monkey do?', o: ["It took a boy's hat", 'It ate the lunch', 'It ran after the elephants', 'It slept in a tree'] },
      { t: 'word', p: 2, q: 'Find a word in paragraph 2 that means "a person who takes care of the animals in a zoo".', a: ['zookeeper'] },
      { t: 'mc', p: 3, q: 'Why was the penguin Noa\'s favorite animal?', o: ['It walks in a funny way', 'It is very big', 'It ate a lot of hay', 'It took a hat'] },
      { t: 'mc', p: 3, q: 'What time did the class come back to school?', o: ['At four', 'At ten', 'At twelve', 'At eight'] },
      { t: 'mc', p: 4, q: 'Why does Noa write to Maya? (two reasons)', o: ['To tell her about the trip and to invite her to the museum', 'To ask her for a hat', 'To tell her about a new pet', 'To say she is sick'] },
    ],
  },
  {
    title: 'Summer Sports Camp', type: 'Advertisement',
    paras: [
      'Do you love sports? Come to our summer camp at Green Park Sports Center!',
      'When: July 1 – July 26, Sunday to Thursday. Time: 8:30 a.m. – 1:00 p.m. Age: 9 to 13.',
      'Activities: swimming, basketball, football, tennis and dance. On Thursdays we have a big game for everybody.',
      'What to bring: a swimsuit, a towel, a hat, a water bottle and a snack. Lunch is not included.',
      'Price: 600 shekels for two weeks or 1,100 shekels for four weeks. Brothers and sisters get 10% off! To register, call Dani at 054-1234567 or visit our website. Hurry – there are only 40 places!',
    ],
    qs: [
      { t: 'mc', p: 0, q: 'What is this text?', o: ['An advertisement for a summer camp', 'A letter from a friend', 'A news report', 'A recipe'] },
      { t: 'mc', p: 2, q: 'Who can come to the camp?', o: ['Children aged 9 to 13', 'Everybody', 'Only teenagers', 'Parents and children'] },
      { t: 'mc', p: 2, q: 'On which day is there NO camp?', o: ['Friday', 'Sunday', 'Monday', 'Thursday'] },
      { t: 'mc', p: 3, q: 'What happens on Thursdays?', o: ['A big game for everybody', 'A swimming test', 'A trip to the beach', 'There is no camp'] },
      { t: 'word', p: 4, q: 'Find a word in paragraph 4 that means "a little food you eat between meals".', a: ['snack'] },
      { t: 'mc', p: 4, q: 'What does the camp NOT give the children?', o: ['Lunch', 'Swimming', 'Tennis', 'Dance'] },
      { t: 'mc', p: 5, q: 'Why does the ad say "Hurry"?', o: ['Because there are only 40 places', 'Because the camp starts today', 'Because the price is going up', 'Because Dani is leaving'] },
    ],
  },
  {
    title: 'The Lost Dog', type: 'Story',
    paras: [
      'Last winter, on a cold and rainy evening, Omer heard a strange noise outside his house. He opened the door and saw a small brown dog. The dog was wet and very hungry. Omer gave him some water and a piece of chicken, and the dog quickly ate everything.',
      'The dog had a red collar, but there was no name on it. Omer wanted to keep him, but his mother said, "Somebody is probably looking for him. We must try to find his family."',
      'The next day, Omer and his sister made a poster with a picture of the dog and their phone number. They put it on trees and in shops all over the neighborhood.',
      'Two days later, the phone rang. It was an old woman called Mrs. Levi. "That\'s my dog, Max!" she said happily. When she came to take Max, she gave Omer a big box of chocolates. "You can visit Max any time you want," she said. Now Omer visits Max every Friday.',
    ],
    qs: [
      { t: 'mc', p: 1, q: 'When did Omer find the dog?', o: ['On a cold and rainy evening', 'On a sunny morning', 'On his way to school', 'On a Friday'] },
      { t: 'mc', p: 1, q: 'What did Omer give the dog?', o: ['Water and chicken', 'Milk and bread', 'A red collar', 'A box of chocolates'] },
      { t: 'mc', p: 2, q: "Why didn't Omer's mother want to keep the dog?", o: ['She thought the dog had a family', "She didn't like dogs", 'The dog was dirty', 'Their house was too small'] },
      { t: 'word', p: 2, q: 'Find a word in paragraph 2 that means "most likely, maybe".', a: ['probably'] },
      { t: 'mc', p: 3, q: 'What did Omer and his sister do?', o: ['They made a poster and put it up', 'They called the police', 'They took the dog to a vet', 'They bought a new collar'] },
      { t: 'mc', p: 4, q: 'Who is Mrs. Levi?', o: ["The dog's owner", "Omer's teacher", "Omer's grandmother", 'A shop owner'] },
      { t: 'mc', p: 4, q: 'What does Omer do every Friday?', o: ['He visits Max', 'He buys chocolates', 'He makes posters', 'He walks in the rain'] },
    ],
  },
];
