import { Marquee } from './marquee.jsx';

const suppliedPosters = [
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608153/chai_neram_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608182/2_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608198/1_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608219/14_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608229/8_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608282/3_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608290/1_updated_font_1_copy.jpg',
  'https://res.cloudinary.com/dib15sbq/image/upload/v1794608300/halloween_poster_copy.jpg',
];
const posterOrders = [
  [0, 3, 6, 1, 4, 7, 2, 5],
  [2, 5, 0, 7, 3, 6, 1, 4],
];
const posterRows = posterOrders.map(order => order.map(index => suppliedPosters[index]));

export function Marquee3D() {
  return <div className="marquee-3d" aria-hidden="true">
    <div className="marquee-3d-plane">
      {posterRows.map((row, index) => <Marquee key={index} reverse={index === 1} pauseOnHover={false} style={{ '--duration': `${34 + index * 5}s`, '--gap': '14px' }}>
        {row.map(src => <figure className="film-frame" key={src}>
          <img src={src} alt="" width="180" height="260" loading="lazy" decoding="async" />
        </figure>)}
      </Marquee>)}
    </div>
  </div>;
}
