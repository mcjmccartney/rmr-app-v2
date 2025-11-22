import localFont from 'next/font/local'

export const cooperLtBT = localFont({
  src: [
    {
      path: '../../public/fonts/cooperltbt-regular-webfont.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/cooperltbt-bold-webfont.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/cooperltbt-italic-webfont.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/cooperltbt-bolditalic-webfont.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-cooper-lt',
  display: 'block',
})

export const cooperMdBT = localFont({
  src: '../../public/fonts/coopermdbt-regular-webfont.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-cooper-md',
  display: 'block',
})

export const cooperBlkBT = localFont({
  src: '../../public/fonts/cooperblkbt-regular-webfont.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-cooper-blk',
  display: 'block',
})

