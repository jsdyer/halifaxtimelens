// Centres identify the subject area in the NRCan mosaics. The album photographs are oblique views.
const album = id => 'https://archives.novascotia.ca/communityalbums/halifaxarchives/archives/?ID=' + id;
export const stories = {
  cogswell: {
    title: 'Cogswell and Scotia Square', center: [44.6511, -63.5774], zoom: 16,
    question: 'Which streets stood where the interchange and Scotia Square appear in 1977?',
    look: 'Start at Duke Street. Use the 1961 photograph to trace the small blocks inland from the piers. The later police photograph catches those blocks during demolition.',
    records: [
      {date: '4 June 1961', title: 'The waterfront before clearance', ref: '102-39-1-418', url: album(437), note: 'Look for the market and police station, Moir’s factory and the streets at the foot of Citadel Hill.'},
      {date: 'Circa 1962–1965', title: 'Demolition seen from the harbour', ref: '102-16N-0068.2', url: album(439), note: 'A police photograph looks west across the redevelopment area as buildings are cleared for Scotia Square.'}
    ]
  },
  dartmouth: {
    title: 'Dartmouth ferry landing', center: [44.6642, -63.5694], zoom: 16,
    question: 'How did the streets leading up from the ferry landing change?',
    look: 'Orient yourself at the water, then trace Portland Street and Queen Street inland. Compare the two oblique views with the street pattern in each mosaic.',
    records: [
      {date: '1950s', title: 'From the ferry docks up Portland Street', ref: '101-80C-1-1.1', url: album(465), note: 'The view reaches inland to Lake Banook. The archivist identifies the Sawmill River in the scene.'},
      {date: '1960s', title: 'Queen Street and the new City Hall', ref: '101-80C-1-1.2', url: album(467), note: 'This view records the new Dartmouth City Hall and Alderney Drive under construction.'}
    ]
  },
  terminal: {
    title: 'Point Pleasant and the container terminal', center: [44.6232, -63.5664], zoom: 15,
    question: 'Where did the container terminal change the edge of the peninsula?',
    look: 'Follow the shoreline north from Point Pleasant Park. Locate the rail yards and piers in the earlier view, then follow their relationship to the terminal in the later one.',
    records: [
      {date: '1960s, by 1967', title: 'Rail yards before the container terminal', ref: '102-16N-0039.2', url: album(440), note: 'A snow-covered view from Tower Road takes in the grain elevators, piers and park edge.'},
      {date: '1980s', title: 'The terminal beside Point Pleasant Park', ref: '102-5-1-84-6', url: album(445), note: 'A view from the south includes the container terminal and the wooded park before Hurricane Juan.'}
    ]
  },
  narrows: {
    title: 'Shannon Park and the MacKay Bridge', center: [44.6851, -63.6115], zoom: 15,
    question: 'What occupied the two shores of the Narrows before and after the bridge appeared?',
    look: 'Follow the crossing from Shannon Park to the Halifax shore. The later photograph also shows the former Africville site. Read the community photographs alongside these distant aerial views.',
    records: [
      {date: '9 September 1965', title: 'Shannon Park before the bridge', ref: '101-80C-1-3-15', url: album(441), note: 'The Bedford Institute of Oceanography and Shannon Park appear along the Dartmouth side of the Narrows.'},
      {date: '1970s', title: 'The MacKay Bridge across the Narrows', ref: '101-80C-1-4-H-44', url: album(475), note: 'Across the harbour from Shannon Park the archivist identifies the site of Africville after demolition.'}
    ],
    context: {title: 'Bob Brooks’s photographs of Africville in the 1960s', url: 'https://archives.novascotia.ca/africville/'}
  }
};
