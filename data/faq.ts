import faqData from './faq.json';

export interface FAQQuestion {
  question: string;
  answer: string;
}

export interface FAQCategory {
  name: string;
  questions: FAQQuestion[];
}

export interface FAQData {
  title: string;
  description: string;
  categories: FAQCategory[];
}

// Export the FAQ data with proper typing
export const FAQ_DATA: FAQData = faqData as FAQData;

// Utility function to convert to the legacy format for backward compatibility
export interface LegacyFAQItem {
  question: string;
  answer: string;
  category: string;
}

export const getLegacyFAQData = (): LegacyFAQItem[] => {
  const legacyData: LegacyFAQItem[] = [];
  
  FAQ_DATA.categories.forEach(category => {
    category.questions.forEach(question => {
      legacyData.push({
        question: question.question,
        answer: question.answer,
        category: category.name
      });
    });
  });
  
  return legacyData;
};