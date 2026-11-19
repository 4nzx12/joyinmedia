// Original project and client content, kept in one place for future edits.
export const logo = 'https://res.cloudinary.com/syfbjskp/image/upload/v1788695919/orange_logo.png';

export const projects = [
  {
    "id": "onam",
    "type": "video",
    "title": "Onam",
    "category": "Festival Content",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701065/onam_out.mp4",
    "accent": "#ff8c42"
  },
  {
    "id": "chai-girl",
    "type": "video",
    "title": "Chai Girl",
    "category": "Brand Presentation",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701071/Chai_girll_tea_presentation_1.mp4",
    "accent": "#ff6b00"
  },
  {
    "id": "boy-and-friend",
    "type": "video",
    "title": "Boy and Friend",
    "category": "Social Content",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701074/boy_and_friend_1_1.mp4",
    "accent": "#ff8c42"
  },
  {
    "id": "disabled",
    "type": "video",
    "title": "Disabled",
    "category": "Social Awareness",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701074/disabled_1.mp4",
    "accent": "#ff6b00"
  },
  {
    "id": "aabis-chai",
    "type": "video",
    "title": "Aabis Chai",
    "category": "Brand Content",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701075/aabis_chai_video_1_1.mp4",
    "accent": "#ff8c42"
  },
  {
    "id": "troll-video",
    "type": "video",
    "title": "Troll Video",
    "category": "Comedy Edit",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701076/Troll_video_1.mp4",
    "accent": "#ff6b00"
  },
  {
    "id": "making-video",
    "type": "video",
    "title": "Making Video",
    "category": "Behind the Scenes",
    "src": "https://res.cloudinary.com/syfbjskp/video/upload/v1788701078/making_video_2_1.mp4",
    "accent": "#ff8c42"
  }
];

// The first video in each collection is its cover.
// Add project IDs here to organize new videos without duplicating media URLs.
export const videoCategories = [
  { id: 'presentation', label: 'Presentation', description: 'Put your brand in the spotlight.', videoIds: ['chai-girl', 'aabis-chai'] },
  { id: 'preparation', label: 'Preparation', description: 'A closer look at how it all comes together.', videoIds: ['making-video'] },
  { id: 'story-skits', label: 'Story Skits', description: 'Little stories. Lasting impressions.', videoIds: ['disabled', 'boy-and-friend', 'troll-video'] },
  { id: 'fast-cuts', label: 'Fast Cuts', description: 'Quick edits. Big energy.', videoIds: ['onam'] },
].map(({ videoIds, ...category }) => {
  const videos = videoIds.map(id => projects.find(project => project.id === id));
  return { ...category, videos, coverVideo: videos[0].src };
});

export const clientStories = [
  {
    "logo": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/aabis_chai.png",
    "name": "Aabis Chai",
    "company": "Tea Snacks Cafe",
    "quote": "Joyin didn't just handle our social media. They understood what our business needed and turned it into content that actually represented us.",
    "mainMetric": "1.67M+ Reach",
    "secondaryOne": "80K+ Engagements",
    "secondaryTwo": "45% Sales Lift",
    "ringValue": "45%",
    "visualHeights": [
      52,
      66,
      74,
      84,
      90,
      78,
      100
    ]
  },
  {
    "logo": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694832/waiver.png",
    "name": "Waiver",
    "company": "Chauffeur Service",
    "quote": "The biggest difference was the way they approached our brand. They brought ideas, strategy and execution together instead of just creating posts.",
    "mainMetric": "1M+ Reach",
    "secondaryOne": "27K+ Engagements",
    "secondaryTwo": "62% Sales Lift",
    "ringValue": "62%",
    "visualHeights": [
      52,
      66,
      74,
      84,
      90,
      78,
      100
    ]
  },
  {
    "logo": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/beside.png",
    "name": "BESIDE",
    "company": "Educational Service",
    "quote": "Working with Joyin gave us a clear direction. We finally knew what we were communicating, who we were targeting and why we were doing it.",
    "mainMetric": "400K+ Reach",
    "secondaryOne": "18K+ Engagements",
    "secondaryTwo": "39% Sales Lift",
    "ringValue": "39%",
    "visualHeights": [
      52,
      66,
      74,
      84,
      90,
      78,
      100
    ]
  }
];

export const trustedBrands = [
  {
    "name": "VARAVUKADA",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694834/VARAVUKADALOGO.png",
    "wide": true
  },
  {
    "name": "Manakish",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694832/manakish_logo.png",
    "wide": false
  },
  {
    "name": "Habiteat",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694832/habiteat.png",
    "wide": false
  },
  {
    "name": "Kebab Crunch",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694832/kebab_crunch_logo.png",
    "wide": false
  },
  {
    "name": "E-TUTOR",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694834/e-tutor.png",
    "wide": false
  },
  {
    "name": "RAAVIS INSTITUTE",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694848/raavis_institute.png",
    "wide": false
  },
  {
    "name": "BROWNIEBOX",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788695096/browniebox.png",
    "wide": false
  },
  {
    "name": "BEATBOX",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/beatbox.png",
    "wide": false
  },
  {
    "name": "SHASKA MATKA",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694834/shaska_matka.png",
    "wide": false
  },
  {
    "name": "Chai Grill",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/chai_grill.png",
    "wide": false
  },
  {
    "name": "LAVISH",
    "src": "https://res.cloudinary.com/syfbjskp/image/upload/v1788694833/lavish.png",
    "wide": false
  },
  {
    "name": "Lakmé Academy",
    "src": "https://res.cloudinary.com/dib15sbq/image/upload/v1794903513/lskme.png",
    "wide": false
  },
  {
    "name": "Perfect TVS",
    "src": "https://res.cloudinary.com/dib15sbq/image/upload/v1794903513/Analysis_output_1.png",
    "wide": false
  },
  {
    "name": "Thaff",
    "src": "https://res.cloudinary.com/dib15sbq/image/upload/v1794903512/thaff_white_transparent_clean.png",
    "wide": false
  },
  {
    "name": "Kazi Kitchen",
    "src": "https://res.cloudinary.com/dib15sbq/image/upload/v1794902973/kazi_kitchen.png",
    "wide": false
  }
];

export const contact = {
  email: 'joyinmediahouse@gmail.com',
  whatsapp: '917736700496',
  instagram: 'https://www.instagram.com/joyinmediahouse/',
  office: 'https://maps.app.goo.gl/qiC4VHdL4EsD3Nyu9',
};

export const backgrounds = {
  light: 'https://res.cloudinary.com/pxbzulmb/video/upload/v1795076334/video_bg_white_VSRExport_1.mp4',
  dark: 'https://res.cloudinary.com/pxbzulmb/video/upload/v1795076458/video_bg_VSRExport.mp4',
};

export function videoPoster(src, width = 560) {
  return src.replace('/video/upload/', `/video/upload/so_0,c_limit,w_${width},q_auto/`).replace(/\.mp4$/, '.jpg');
}

export function videoSource(src, width = 1080) {
  return src.replace('/video/upload/', `/video/upload/c_limit,w_${width},q_auto,vc_auto/`);
}
