// End-to-End Type Safety & Data Validation for Datie

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod"
] as const;

export type KeralaDistrict = typeof KERALA_DISTRICTS[number];

export const LOOKING_FOR_OPTIONS = [
  "Soulmate",
  "Friendship",
  "Casual Dating",
  "Long-term Relationship",
  "Marriage",
  "Coffee & Conversations"
] as const;

export type LookingFor = typeof LOOKING_FOR_OPTIONS[number];

export interface ProfileInput {
  name: string;
  age: number | string;
  gender: string;
  district: string;
  lookingFor: string;
  bio?: string;
  interests?: string[];
  profession?: string;
  education?: string;
  height?: string;
  religion?: string;
  photoURL?: string;
  photos?: string[];
}

export interface ValidationResult<T> {
  success: boolean;
  errors: { [field: string]: string };
  data?: T;
}

export function validateProfile(input: ProfileInput): ValidationResult<ProfileInput> {
  const errors: { [field: string]: string } = {};

  // Name validation
  const name = (input.name || "").trim();
  if (!name) {
    errors.name = "Name is required";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (name.length > 50) {
    errors.name = "Name must be under 50 characters";
  }

  // Age validation
  const age = Number(input.age);
  if (!input.age || isNaN(age)) {
    errors.age = "Valid age is required";
  } else if (age < 18) {
    errors.age = "You must be at least 18 years old to use Datie";
  } else if (age > 100) {
    errors.age = "Please enter a valid age under 100";
  }

  // District validation
  if (!input.district) {
    errors.district = "Please select your district";
  }

  // Looking For validation
  if (!input.lookingFor) {
    errors.lookingFor = "Please specify what you are looking for";
  }

  // Bio validation
  if (input.bio && input.bio.length > 500) {
    errors.bio = "Bio cannot exceed 500 characters";
  }

  // Interests validation
  if (input.interests && input.interests.length > 10) {
    errors.interests = "Select up to 10 interests";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
    data: input
  };
}

export function validateMessage(text: string): { valid: boolean; error?: string; cleanText: string } {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { valid: false, error: "Message cannot be empty", cleanText: "" };
  }
  if (trimmed.length > 2000) {
    return { valid: false, error: "Message is too long (max 2000 characters)", cleanText: trimmed.slice(0, 2000) };
  }
  return { valid: true, cleanText: trimmed };
}
