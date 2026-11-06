import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {TRICKS as legacy} from '../../public/data.js';
const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'artwork/cards/tricks/deck-v1');
const {cards}=JSON.parse(await readFile(path.join(root,'tests/fixtures/theory85-catalog.json'),'utf8'));
export const keyFor=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/°/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const descriptions={
 'Ollie':'A clean level ollie over the flat, both feet above one horizontal skateboard, no flip, no hand grab.',
 'Nollie':'A nose-popped nollie, front foot snapping the nose while the back foot levels the board; no grab, no flip.',
 'Pop Shuvit':'A pop shove-it: one board rotates flat horizontally under the skater, grip tape stays upwards, no longitudinal flip.',
 'Frontside 180':'Frontside 180 ollie: rider and board turn together, board remains under both shoes, level and griptape up; front shoulder leads the turn.',
 'Kickflip':'Kickflip: the board flips around its long axis independently below airborne feet, clearly show underside and two trucks, one board only.',
 'Varial Kickflip':'Varial kickflip: one airborne board doing a backside shove-it and a longitudinal kickflip under a tucked skater.',
 'Frontside Flip':'Frontside 180 kickflip: rider turns frontside with a flipped board underneath, open front shoulder and naturally spread arms.',
 'Backside Flip':'Backside 180 kickflip: rider turns backside, back and trailing shoulder visible, one flipped board underneath bent legs.',
 'Varial Heelflip':'Varial heelflip: frontside shove-it plus heelflip, front heel flicks outward while board turns flat and flips under the feet.',
 'Bigspin':'Bigspin: rider turns 180 while the board turns a 360 shove-it; show one griptape-up deck rotating flat below the rider, no flip.',
 'Inward Heelflip':'Inward heelflip: backside pop shove-it with an outward heel flip, board tilted diagonally under the skater.',
 'Hardflip':'Hardflip: one board passes between raised knees in a steep tilted frontside shove-it/kickflip motion; retain a believable single deck.',
 '360 Flip':'360 flip/tre flip: one deck rotates in a 360 backside shove-it plus kickflip, underside angled visibly below the airborne shoes.',
 'Laser Flip':'Laser flip: frontside 360 shove-it plus heelflip, outward heel flick, one patterned board rotating below the rider.',
 'Impossible':'Impossible: a single board wraps vertically around the rear foot, rear foot stays close to the deck, the front foot lifted away; not multiple ghost boards.',
 '50-50 Grind':'50-50 grind: both trucks locked onto one low rail, board parallel to the rail, both shoes over the bolts, the deck is not doing a boardslide.',
 'Boardslide':'Boardslide: one board perpendicular across a single low rail, the middle underside of the deck slides on top of the rail, trucks clear on either side.',
 'Lipslide':'Lipslide: rider and rear truck pass across a low rail before landing in a slide; one deck now perpendicular with its middle sliding on the rail. Two trucks and four wheels only.',
 'Tailslide':'Tailslide: the tail of one skateboard slides along the top of a low concrete ledge, front/nose points out from the ledge, rear foot presses the tail, trucks do not grind.',
 'Noseslide':'Noseslide: nose of one deck slides on a concrete ledge, board roughly perpendicular to it, front foot weights the nose, rear foot and tail lifted outside the ledge.',
 'Nosegrind':'Nosegrind: only the front truck grinds a low ledge; board parallel to the edge, front foot weighted, rear truck and tail clearly lifted.',
 '5-0 Grind':'5-0 grind: only the rear truck grinds the ledge, deck parallel with nose raised, front truck floating above the edge.',
 'Crooked Grind':'Crooked grind: front truck locks diagonally across a low ledge, nose pressed down, tail raised and angled off the side; a clear single board.',
 'Feeble Grind':'Feeble grind: rear truck grinds one rail, front truck crosses to the far side, nose dips below the rail; rear shoe weights the back truck.',
 'Suski Grind':'Backside Suski grind: rear truck on a low concrete ledge like a 5-0, nose raised and tweaked diagonally AWAY from the ledge, toward the opposite side of the box.',
 'Salad Grind':'Salad grind: rear truck locked onto a low ledge, nose raised and tweaked diagonally TOWARD the ledge, contrasting the outward nose of a Suski.',
 'Overcrook':'Overcrook grind: front truck grinds diagonally across a rail with the board over the far side of the rail; nose pressed down, tail raised.',
 'Bluntslide':'Bluntslide: tail and rear wheel area slide along a concrete ledge, board steeply pitched almost vertical, rear wheels beyond the edge; rider stands above the tail, not riding along the deck normally.',
 'Nosebluntslide':'Nosebluntslide: nose and front wheel area locked steeply over a concrete ledge in a near vertical noseblunt position, tail raised high, weight over the front foot.',
 'Hurricane':'Hurricane grind: rider rotates 180 into a fakie Smith-like position on a low rail, rear truck engaged and front truck dipped across the other side; show a stable single board and the turned shoulders.',
 '180°':'A 180-degree aerial above a smooth quarterpipe, rider and griptape-up board turning together, both shoes on the deck, arms open.',
 'Indy Grab':'Indy grab aerial above the halfpipe: rear hand grabs the toe-side edge between the feet, front hand free, knees tucked, both shoes firmly on one deck.',
 '360°':'A 360-degree aerial above a concave halfpipe, rider viewed from the back mid-rotation, board with both shoes planted, one continuous deck.',
 'Melon Grab':'Melon grab aerial: front hand reaches to the heel-side edge between the feet, knees tucked, back hand free, board under both shoes.',
 'Stalefish':'Stalefish aerial: rear hand reaches BEHIND the back leg to grip the heel-side edge between the feet, front hand free, believable bent-knee posture.',
 '540°':'A high 540-degree aerial above the halfpipe with knees tucked and a compact grab, rotated torso, entire rider and one board visible.',
 '720°':'A high 720-degree aerial above a continuous halfpipe, compact tucked body, both feet on one deck and a natural grab; different pose/camera from 540 and 900.',
 '1080°':'A very high 1080-degree aerial above the large halfpipe, highly compact rotating tuck, one natural grab, all limbs and the single board legible.'
};
await mkdir(path.join(dir,'illustrations'),{recursive:true});await mkdir(path.join(dir,'generation'),{recursive:true});
const reusable={'Heelflip':'heelflip','Smith Grind':'smith-grind','900°':'900'};
for(const [name,key]of Object.entries(reusable))await copyFile(path.join(root,'artwork/cards/tricks/layer-templates-v1/illustrations',key+'.png'),path.join(dir,'illustrations',keyFor(name)+'.png'));
const common='Create ONE clean full-bleed portrait illustration master for layer 1 of a Sk8 Heroes card. Style: the approved sunny richly detailed graphic-novel/screenprint art, vivid cobalt sky, turquoise lagoon/ocean, palm trees, cream coastal concrete, distant city and mountain, orange and teal accents. No card frame, title, badge, words, typography, numbers, icons, motion arrows, motion ribbons, logos or watermark. The complete skater and the ENTIRE single board must be clearly visible in the middle 20–68% of the portrait. Generous sky above and quiet ground/transition below will receive separate card layout later. Perspective and limb anatomy must be credible. One board, one deck, two trucks, exactly FOUR physical wheels (only perspective-visible wheels need appear). No duplicated limbs or wheel sets. Diverse adult riders with varied outfits/caps/hair matching the existing art style; no extra people near the action. Opaque illustrated background. Portrait composition 2:3.';
const jobs=cards.filter(c=>!reusable[c.name]).map(c=>{
 const previous=legacy.find(x=>x.name===c.name),cell=previous?.cell;
 const reference=previous?path.join(root,'public/assets',`tricks-${previous.sheet}.webp`):path.join(root,'artwork/cards/tricks/layer-templates-v1/illustrations/heelflip.png');
 const referenceRole=previous?`The reference is a four-card sheet. Use ONLY the ${cell<2?'UPPER':'LOWER'} ${cell%2?'RIGHT':'LEFT'} illustration (${c.name}) as the edit target. Preserve that rider, clothing, trick and scene style while removing the old card layout and completing the sky/ground naturally. Ignore all other cards.`:'The reference is the approved clean art style. Create a new illustration with the requested distinct trick, same coastal park world.';
 return {key:keyFor(c.name),name:c.name,type:c.type,tier:c.tier,reference,prompt:(previous?'Use case: precise-object-edit. ':'Use case: stylized-concept. ')+referenceRole+' '+common+' Specific action: '+descriptions[c.name]};
});
await writeFile(path.join(dir,'generation-plan.json'),JSON.stringify({date:'2026-11-01',tool:'built-in image_gen',uniqueTricks:cards.length,physicalCards:85,reused:Object.values(reusable),poseSources:['https://nollieskateboarding.com/en/news/15672','https://skateboarddeutschland.de/wp-content/uploads/2020/07/Judge-Manual-SKD-05-07-2020-lowres.pdf'],jobs},null,2));
await writeFile(path.join(dir,'legacy-catalog.json'),JSON.stringify(legacy,null,2));
console.log(JSON.stringify({directory:dir,jobs:jobs.length,reused:3}));
