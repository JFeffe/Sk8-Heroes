// Poker trim; the original artwork coordinates are preserved with narrow cream side margins.
export const POKER={widthMm:63,heightMm:88,widthPx:1008,heightPx:1408};
export const CARD_REFERENCE={width:900,height:1300};
export const CARD_VIEW_WIDTH=CARD_REFERENCE.height*POKER.widthMm/POKER.heightMm;
export const CARD_SIDE=(CARD_VIEW_WIDTH-CARD_REFERENCE.width)/2;
export const cardLeft=x=>(x+CARD_SIDE)/CARD_VIEW_WIDTH*100;
export const cardWidth=w=>w/CARD_VIEW_WIDTH*100;
