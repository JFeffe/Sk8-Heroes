export const SKATERS=[
 {id:'neo',name:'Néo',colorKey:'blue',colorName:'bleu',color:'#3688dc',ink:'#fff9e8',look:'Bonnet et veste cobalt',image:'assets/skaters/neo.webp'},
 {id:'ruby',name:'Ruby',colorKey:'red',colorName:'rouge',color:'#db5258',ink:'#fff9e8',look:'Afro court et bomber rouge',image:'assets/skaters/ruby.webp'},
 {id:'jade',name:'Jade',colorKey:'green',colorName:'vert',color:'#49a878',ink:'#082c23',look:'Tresse, casquette et veste cargo',image:'assets/skaters/jade.webp'},
 {id:'sol',name:'Sol',colorKey:'yellow',colorName:'jaune',color:'#efd058',ink:'#3c310c',look:'Bob et hoodie soleil',image:'assets/skaters/sol.webp'},
 {id:'milo',name:'Milo',colorKey:'orange',colorName:'orange',color:'#ec9145',ink:'#3e240b',look:'Bandeau et maillot orange',image:'assets/skaters/milo.webp'},
 {id:'iris',name:'Iris',colorKey:'purple',colorName:'mauve',color:'#a381d1',ink:'#23133b',look:'Carré court et chemise mauve',image:'assets/skaters/iris.webp'}
];
export const getSkater=id=>SKATERS.find(s=>s.id===id)||null;
export const DIE_COLORS=SKATERS.map(({colorKey,colorName,color,ink})=>({key:colorKey,name:colorName,color,ink}));
export const dieColor=key=>DIE_COLORS.find(c=>c.key===key)||null;
export const wildColor=s=>getSkater(s.skaterId)?.colorKey||null;
export const isOwnStar=(die,ownColor)=>!!ownColor&&die?.color===ownColor&&die.face===1;
