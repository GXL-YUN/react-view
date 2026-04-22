// types/category.ts
export interface CategoryItem {
  FDID: string;
  FDNAME: string;
}

export interface CategorySelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  apiFunction: (parentId?: string) => Promise<CategoryItem[]>;
  disabled?: boolean;
}