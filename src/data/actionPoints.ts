import { ActionPoint } from '@/types';

// Predefined action points based on your database screenshot
export const predefinedActionPoints: ActionPoint[] = [
  {
    id: 'dR2vCl8iTsGTaNOPx.sO-A',
    header: 'Consider Supplements',
    details: 'The Dorwest Scullcap & Valerian supplement can help dogs feel calm and focused. Try adding this to [Dog Name]\'s daily routine.'
  },
  {
    id: 'eGARTzfTS9SXyAkSN2OTpg',
    header: 'Help {{Dog}} Calm {{Self}} Down',
    details: 'Sniffing, licking and chewing all release soothing hormones in a dog\'s brain. Try and encourage [Dog Name] to do these activities when [he/she] is feeling overwhelmed.'
  },
  {
    id: 'QSzLfZlbTZyfTZ2YRFPPCQ',
    header: 'Teach a Flight Cue',
    details: 'Flight cues are amazing - they show your dog there is another option to \'fight\' and it creates a positive association with moving away from triggers.'
  },
  {
    id: 'NsOc1zRATcWfNgOT588Zqg',
    header: 'Learn Sniffy Games',
    details: 'Start off teaching [Dog Name] some sniffy games with a cue word so [he/she] understands what you\'re asking for when you need [him/her] to sniff.'
  },
  {
    id: 'F9g-sQqBRplDkmFkrF3C-w',
    header: 'Consider Diet',
    details: 'A switch in [Dog Name]\'s diet could make a big change. I would consider looking at a high quality, single protein diet with no additives.'
  },
  {
    id: 'tc-CDlletfG9tE0QlSE2.Q',
    header: '3-Step Interruption Process',
    details: 'Simply interrupting a behaviour can help, but if you make it a 3-step process it should work much better and be less confrontational.'
  },
  {
    id: 'HnDvny7QTC6R2HUyitw6Tg',
    header: 'Increase {{Dog}}\'s Exercise',
    details: 'Exercise could mean actual walking time, sniffing time, or simply giving [him/her] new places to explore. Mental stimulation is just as tiring as physical exercise.'
  },
  {
    id: 'w8lDTQ8gQt203W3gBXWZzw',
    header: 'Play Sniffy Games & Brain Games',
    details: 'Play treasure hunt games and sniffy games to help add enrichment to daily life. Add a word or cue to these games so you can redirect [Dog Name] when needed.'
  },
  {
    id: 'CSozTocJTHOlQyk9wgMZBw',
    header: 'Show {{Dog}} You Hear {{Him}}',
    details: 'By closely watching body language, you can show [Dog Name] that [he/she] doesn\'t need to escalate behaviours to get your attention.'
  },
  {
    id: 'ybEp-4HqSE2lBxFMnhYMLw',
    header: 'Keep {{Dog}} Below Threshold',
    details: 'This is the most important thing - make sure there is no point during training in which [Dog Name] goes over threshold and becomes reactive.'
  },
  {
    id: 'clzLvJpEQLlHQZ6nTfe.w',
    header: 'Keep Calm When Leaving',
    details: 'Whenever you leave the house, make it as calm and non-eventful as possible. Same as when you return - keep greetings calm and brief.'
  },
  {
    id: 'wZ6HTuA8R2QllArV5APMlQ',
    header: 'Practice for Real-Life Situations',
    details: 'Practice your process lots, so you feel confident when the real situation arises. This is ideal to do when [Dog Name] is calm and focused.'
  },
  {
    id: 'a-lXQLQosTGKChGORuNe.vw',
    header: 'Think About Trigger Stacking',
    details: 'Use the Trigger Stacking Guide from the Dog Club - this helps to show how [Dog Name]\'s triggers can build up throughout the day.'
  },
  {
    id: 'oSqelwMQy5plD.ltloAA',
    header: 'Remember the ABC of Behaviour',
    details: 'Antecedent: What happened before the behaviour? Behaviour: What did [Dog Name] do? Consequence: What happened after the behaviour?'
  },
  {
    id: 'mYhKZnloRlmFbu3kAYCtow',
    header: 'Long Lines or Retractable Leads',
    details: 'A retractable lead or long line will mean [Dog Name] gets more exercise per walk as [he/she] can explore more and make more choices.'
  },
  {
    id: 'sBePvr6JTH6zybLUymvpnQ',
    header: 'Create Toileting Structure',
    details: 'Consistent and regular walks will help show [Dog Name] [he/she] has plenty of opportunities to toilet outside, reducing accidents indoors.'
  },
  {
    id: 'aTQ.9bBfSeSuQNaVqbFR5w',
    header: 'Keep Playing \'Touch\'',
    details: 'Touch is great for lots of things, including redirecting behaviour, recall and guiding them through situations they find difficult.'
  },
  {
    id: 'FSLTl8VETe-PuACfmZP3vg',
    header: 'Build Patience in Tiny Doses',
    details: 'Patience is a wonderful skill to have. Build it up in small doses, being sure to get ahead of any discomfort. If [Dog Name] always expects to feel uncomfortable while waiting, [he/she] will anticipate it and become less patient.\n\nIf you know [his/her] limit is, say 30 seconds, make sure you go after 20 seconds. Then next time, try 25 (literally set a stopwatch, it really helps!) then gradually build it, always getting up/leaving BEFORE [he/she] gets frustrated.'
  }
];

// Helper function to replace placeholders with actual dog name and pronouns
export function personalizeActionPoint(actionPoint: ActionPoint, dogName: string, dogGender: 'Male' | 'Female'): ActionPoint {
  const pronouns = dogGender === 'Male'
    ? { he: 'he', him: 'him', his: 'his', self: 'himself' }
    : { he: 'she', him: 'her', his: 'her', self: 'herself' };

  const personalizedHeader = actionPoint.header
    .replace(/\{\{Dog\}\}/g, dogName)
    .replace(/\{\{Self\}\}/g, pronouns.self)
    .replace(/\{\{Him\}\}/g, pronouns.him)
    // Handle simple bracket pronouns like [he], [his], [him]
    .replace(/\[he\]/g, pronouns.he)
    .replace(/\[his\]/g, pronouns.his)
    .replace(/\[him\]/g, pronouns.him);

  const personalizedDetails = actionPoint.details
    .replace(/\[Dog Name\]/g, dogName)
    .replace(/\[he\/she\]/g, pronouns.he)
    .replace(/\[him\/her\]/g, pronouns.him)
    .replace(/\[his\/her\]/g, pronouns.his)
    // Handle simple bracket pronouns like [he], [his], [him]
    .replace(/\[he\]/g, pronouns.he)
    .replace(/\[his\]/g, pronouns.his)
    .replace(/\[him\]/g, pronouns.him);

  return {
    ...actionPoint,
    header: personalizedHeader,
    details: personalizedDetails
  };
}
