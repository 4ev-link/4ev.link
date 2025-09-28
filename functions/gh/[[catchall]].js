export const onRequest = ({params:{catchall:[o,r,b,...p]}}) => fetch(`https://raw.githack.com/${o}/${r}/${b}/${p.join('/')}`);
