// Member model structure for Firebase
export const MemberSchema = {
  name: String,
  bio: String,
  profileImage: String,
  interests: Array,
  role: String,
  year: String,
  createdAt: Date,
  updatedAt: Date,
};

// Helper function to create a member document
export const createMember = (data) => {
  // Determine role from dev/des/pm flags
  let role = '';
  if (data.core) role = 'Core';
  else if (data.dev) role = 'Developer';
  else if (data.des) role = 'Designer';
  else if (data.pm) role = 'Product Manager';
  else role = 'Member';

  // Build interests from favorite things
  const interests = [];
  if (data['favorite thing 1']) interests.push(data['favorite thing 1']);
  if (data['favorite thing 2']) interests.push(data['favorite thing 2']);
  if (data['favorite thing 3']) interests.push(data['favorite thing 3']);

  return {
    name: data.name || '',
    bio: data.quote || data.bio || data.about || '',
    profileImage: data.picture || data.profileImage || data.image || '',
    interests: interests.length > 0 ? interests : (data.interests || []),
    role: role,
    year: data.year || '',
    major: data.major || '',
    minor: data.minor || '',
    home: data.home || '',
    birthday: data.birthday || '',
    favoriteDartmouthTradition: data['favorite dartmouth tradition'] || '',
    funFact: data['fun fact'] || '',
    dev: data.dev || false,
    des: data.des || false,
    pm: data.pm || false,
    core: data.core || false,
    mentor: data.mentor || false,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Include any additional fields from the JSON
    ...data,
  };
};
