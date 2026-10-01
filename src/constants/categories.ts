import { AdobeCategory } from '../types';

export const ADOBE_STOCK_CATEGORIES: AdobeCategory[] = [
  { id: 1, name: 'Animals', description: 'Animals, pets, wildlife, insects' },
  { id: 2, name: 'Buildings and Architecture', description: 'Urban structures, homes, interiors, architecture' },
  { id: 3, name: 'Business', description: 'Office, corporate, teamwork, finance, business concepts' },
  { id: 4, name: 'Drinks', description: 'Beverages, coffee, cocktails, wine, beer, water' },
  { id: 5, name: 'The Environment', description: 'Nature, climate, conservation, weather, ecology' },
  { id: 6, name: 'States of Mind', description: 'Emotions, feelings, mental health, mood, mindfulness' },
  { id: 7, name: 'Food', description: 'Meals, cooking, bakery, fruits, vegetables, culinary' },
  { id: 8, name: 'Graphic Resources', description: 'Backgrounds, textures, patterns, 3D renders, templates' },
  { id: 9, name: 'Hobbies and Leisure', description: 'Crafts, gaming, reading, music, entertainment, arts' },
  { id: 10, name: 'Industry', description: 'Manufacturing, factories, construction, energy, tools' },
  { id: 11, name: 'Landscapes', description: 'Mountains, oceans, sunsets, forests, vistas, scenic views' },
  { id: 12, name: 'Lifestyle', description: 'Daily life, home living, routines, wellness, relationships' },
  { id: 13, name: 'People', description: 'Portraits, diverse people, age groups, human interactions' },
  { id: 14, name: 'Plants and Flowers', description: 'Botany, flowers, trees, gardens, foliage' },
  { id: 15, name: 'Culture and Religion', description: 'Traditions, festivals, spirituality, heritage, ceremonies' },
  { id: 16, name: 'Science', description: 'Laboratory, medical, astronomy, biotechnology, genetics' },
  { id: 17, name: 'Social Issues', description: 'Community, charity, diversity, social causes, protests' },
  { id: 18, name: 'Sports', description: 'Fitness, athletics, outdoor sports, gym, competition' },
  { id: 19, name: 'Technology', description: 'Computers, artificial intelligence, cyber, smartphones, robotics' },
  { id: 20, name: 'Transport', description: 'Cars, aviation, trains, ships, logistics, traffic' },
  { id: 21, name: 'Travel', description: 'Tourism, landmarks, vacations, exploration, journey' },
];

export const getCategoryById = (id: number): AdobeCategory => {
  return ADOBE_STOCK_CATEGORIES.find(cat => cat.id === id) || ADOBE_STOCK_CATEGORIES[7]; // Default to Graphic Resources
};
