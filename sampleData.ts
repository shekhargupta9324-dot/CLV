
export interface SampleCustomer {
  id: string;
  name: string;
  company: string;
  category: string;
  age: number;
  gender: string;
  tenure: number;
  monthlySpend: number;
  totalSpend: number;
  lastPurchaseDate: string;
  supportCalls: number;
}

const names = [
  "Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas", "Henry", "Alexander",
  "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Levi", "Sebastian", "Mateo",
  "Jack", "Owen", "Theodore", "Aiden", "Samuel", "Joseph", "John", "David", "Wyatt", "Matthew",
  "Luke", "Asher", "Carter", "Julian", "Grayson", "Leo", "Jayden", "Gabriel", "Isaac", "Lincoln",
  "Anthony", "Hudson", "Dylan", "Ezra", "Thomas", "Charles", "Christopher", "Jaxon", "Maverick", "Josiah",
  "Olivia", "Emma", "Charlotte", "Amelia", "Ava", "Sophia", "Isabella", "Mia", "Evelyn", "Harper",
  "Luna", "Camila", "Gianna", "Elizabeth", "Eleanor", "Ella", "Abigail", "Sofia", "Avery", "Scarlett",
  "Emily", "Aria", "Penelope", "Chloe", "Layla", "Mila", "Nora", "Hazel", "Madison", "Ellie",
  "Lily", "Nova", "Isla", "Grace", "Violet", "Aurora", "Riley", "Zoey", "Willow", "Emilia",
  "Stella", "Zoe", "Victoria", "Hannah", "Addison", "Leah", "Lucy", "Eliana", "Ivy", "Everly"
];

const categories = {
  Amazon: ["Electronics", "Books", "Home & Kitchen", "Fashion", "Beauty"],
  Flipkart: ["Mobiles", "Fashion", "Electronics", "Home", "Appliances"],
  Tata: ["Automotive", "Steel", "Consultancy", "Chemicals", "Consumer Products"],
  BMW: ["Luxury Sedans", "SUVs", "Sports Cars", "Electric Vehicles", "Motorcycles"],
  Tesla: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck"]
};

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number): number => parseFloat((Math.random() * (max - min) + min).toFixed(2));

export const generateDataset = (company: keyof typeof categories, count: number = 100): SampleCustomer[] => {
  return Array.from({ length: count }, (_, i) => {
    const tenure = getRandomInt(1, 60);
    const monthlySpend = getRandomFloat(50, 2000);
    
    return {
      id: `${company}-${1000 + i}`,
      name: getRandomItem(names) + " " + getRandomItem(names),
      company,
      category: getRandomItem(categories[company]),
      age: getRandomInt(18, 70),
      gender: getRandomItem(["Male", "Female", "Other"]),
      tenure,
      monthlySpend,
      totalSpend: parseFloat((monthlySpend * tenure).toFixed(2)),
      lastPurchaseDate: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supportCalls: getRandomInt(0, 10)
    };
  });
};

export const downloadCSV = (data: SampleCustomer[], filename: string) => {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(","));
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
