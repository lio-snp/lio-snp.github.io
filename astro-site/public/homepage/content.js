/* Update this file to change the public content without touching the layout. */
window.SITE_DATA = {
  news: [
    { date: 'Sep 2026', text: 'Started the MSc in Computer Science (Financial Computing) at <strong>HKU</strong>.' },
    { date: 'Mar 2026', text: '<strong>Guotai Haitong Securities</strong> · Quantitative Research Intern' },
    { date: 'Dec 2025', text: '<strong>Tencent (FiT)</strong> · Data Science Intern' },
    { date: 'Oct 2025', text: '<strong>Guotai Haitong Securities</strong> · Financial Engineering Intern' },
    { date: '2025', text: 'Received the national Grand Prize and fifth place in the <strong>SAS China University Data Analytics Competition</strong>.' },
    { date: 'Sep 2024', text: '<strong>Chengdu Random Forest Technology</strong> · Data Analysis Assistant' },
    { date: 'Jan 2024', text: '<strong>Kaiyuan Securities</strong> · Industry Research Intern' },
    { date: '2024', text: 'Began research on remote sensing, climate information, and credit risk at the <strong>SWUFE Fintech Innovation Lab</strong>.' }
  ],
  featured: [
    {
      id: 'eventalign',
      title: 'EventAlign: Residual-Information Diagnostics for Sparse Textual and Event Records',
      venue: 'Working paper, in revision',
      authors: ['Yanlin Liu', 'Zhicheng Li'],
      image: '/homepage/assets/eventalign.svg',
      imageAlt: 'EventAlign local one-day and dense thirty-day exposure-window figure with a thinking monkey cutout',
      thumbnail: {
        kind: 'eventalign',
        plot: '/homepage/assets/eventalign-exposure-windows.png',
        subject: '/homepage/assets/eventalign-thinking-monkey.png'
      },
      href: '',
      citation: '@misc{liu2026eventalign,\n  title={EventAlign: Residual-Information Diagnostics for Sparse Textual and Event Records},\n  author={Liu, Yanlin and Li, Zhicheng},\n  year={2026},\n  note={Working paper, in revision}\n}'
    },
    {
      id: 'gift',
      title: 'GIFT: LLM-Guided State-Reward Interface for Financial Reinforcement Learning',
      venue: 'Preprint, in revision · 2026',
      authors: ['Yanyan Wu', 'Boyi Zhang', 'Yanlin Liu', 'et al.'],
      image: '/homepage/assets/gift.svg',
      imageAlt: 'GIFT versus PPO risk-return plot from the paper, with a surprised cat cutout',
      thumbnail: {
        kind: 'gift',
        plot: '/homepage/assets/gift-risk-return-source.png',
        subject: '/homepage/assets/gift-surprised-cat.png'
      },
      href: 'https://arxiv.org/abs/2606.08450',
      citation: '@misc{wu2026gift,\n  title={GIFT: LLM-Guided State-Reward Interface for Financial Reinforcement Learning},\n  author={Wu, Yanyan and Zhang, Boyi and Liu, Yanlin and others},\n  year={2026},\n  eprint={2606.08450},\n  archivePrefix={arXiv}\n}'
    }
  ],
  researchPath: [
    { id: 'lending', name: 'Lending Club', start: '2024-07', end: '2024-12', note: 'Part of my RA work at FIC.' },
    { id: 'sme', name: 'SME', start: '2025-01', end: null, note: 'I worked on satellite data and credit-risk prediction at FIC.' },
    { id: 'eventalign', name: 'EventAlign', start: '2026-02', end: null, note: 'Why are the AUC gains so small?', from: ['lending', 'sme'] },
    { id: 'gift', name: 'GIFT', start: '2026-03', end: null, note: "Could LESR's approach help trading agents learn from fewer samples?" },
    { id: 'pairwise', name: 'Beyond Pairwise', start: '2026-05', end: '2026-07', note: 'I liked Physics of Language Models, then moved toward theory to fit my compute budget.' }
  ],
  finance: [
    {
      title: 'Can Remote Sensing Climate Information Improve Dynamic Risk Monitoring of SME Loans?',
      authors: 'Yanlin Liu, Zhiyong Li, Wenhan Dai, Mingyan Leng',
      venue: 'Working paper',
      year: '2026'
    }
  ],
  publications: [
    {
      id: 'eventalign',
      title: 'EventAlign: Residual-Information Diagnostics for Sparse Textual and Event Records',
      authors: 'Yanlin Liu, Zhicheng Li',
      venue: 'Working paper, in revision',
      year: 2026,
      type: 'Working paper',
      topics: ['Evaluation', 'Financial AI'],
      href: ''
    },
    {
      id: 'pairwise',
      title: 'Beyond Pairwise Statistics: Local Visibility Does Not Ensure Learning',
      authors: 'Yanlin Liu, Zhicheng Li',
      venue: 'Under review at AAAI 2027',
      year: 2026,
      type: 'Under review',
      topics: ['Machine Learning', 'Evaluation'],
      href: '',
      citation: '@misc{liu2026beyondpairwise,\n  title={Beyond Pairwise Statistics: Local Visibility Does Not Ensure Learning},\n  author={Liu, Yanlin and Li, Zhicheng},\n  year={2026},\n  note={Manuscript under review}\n}'
    },
    {
      id: 'gift',
      title: 'GIFT: LLM-Guided State-Reward Interface for Financial Reinforcement Learning',
      authors: 'Yanyan Wu, Boyi Zhang, Yanlin Liu, et al.',
      venue: 'arXiv preprint, in revision',
      year: 2026,
      type: 'Preprint',
      topics: ['Financial AI', 'Reinforcement Learning'],
      href: 'https://arxiv.org/abs/2606.08450'
    },
    {
      id: 'climate',
      title: 'Can Remote Sensing Climate Information Improve Dynamic Risk Monitoring of SME Loans?',
      authors: 'Yanlin Liu, Zhiyong Li, Wenhan Dai, Mingyan Leng',
      venue: 'Working paper',
      year: 2026,
      type: 'Working paper',
      topics: ['Financial AI', 'Alternative Data'],
      href: ''
    }
  ],
  education: [
    {
      degree: 'MSc in Computer Science (Financial Computing)',
      institution: 'The University of Hong Kong',
      period: '2026 – 2028'
    },
    {
      degree: 'B.Mgt. in Information Management and Information Systems',
      institution: 'Southwestern University of Finance and Economics',
      period: '2022 – 2026'
    },
    {
      degree: 'B.S. in Management Information Systems',
      institution: 'University of Delaware · Joint program',
      period: '2022 – 2026'
    }
  ]
};
