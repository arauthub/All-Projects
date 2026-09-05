export interface WagtailPage {
  id: number;
  meta: {
    type: string;
    detail_url: string;
    html_url: string;
    slug: string;
    first_published_at: string;
  };
  title: string;
  body: StreamBlock[];
}

export interface StreamBlock {
  type: string;
  id: string;
  value: any;
}

export interface HeroBlockValue {
  title: string;
  subtitle?: string;
  image?: number;
  button_text?: string;
  button_url?: string;
}

export interface FeatureBlockValue {
  icon?: string;
  title: string;
  description: string;
}

export interface CardBlockValue {
  image: number | null;
  title: string;
  content: string;
}

export interface TabValue {
  label: string;
  content: string;
}

export interface TabsBlockValue {
  tabs: TabValue[];
}

export interface AccordionItemValue {
  header: string;
  content: string;
}

export interface AccordionBlockValue {
  items: AccordionItemValue[];
}

export interface SliderBlockValue {
  label: string;
  min_value: number;
  max_value: number;
  step: number;
}

export interface ToggleBlockValue {
  label: string;
  default_value: boolean;
}

export interface ProgressBlockValue {
  label?: string;
  value: number;
  mode: 'determinate' | 'indeterminate' | 'buffer' | 'query';
}

export interface TableBlockValue {
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface StepValue {
  label: string;
  content: string;
}

export interface StepperBlockValue {
  title?: string;
  steps: StepValue[];
}

export interface Shop {
  id: number;
  shop_name: string;
  owner_name: string;
  logo_url: string;
  theme_choice: string;
  primary_color: string;
  secondary_color: string;
  currency_symbol: string;
  gstin: string;
}

export interface Mechanic {
  id: number;
  name: string;
  specialty: string;
  is_active: boolean;
  display_name: string;
}

export interface Vehicle {
  id: number;
  vehicle_type: 'bike' | 'car';
  make: string;
  model: string;
  year: number;
  license_plate: string;
  owner_name: string;
}

export interface ServiceJob {
  id: number;
  job_id: string;
  vehicle_display: string;
  assigned_mechanic_display: string;
  status: string;
  issue_description: string;
  created_at: string;
}

export interface InventoryPart {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  unit_of_measure: string;
}

export interface Attendance {
  id: number;
  mechanic_id: number;
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
}

export interface Payroll {
  id: number;
  mechanic_id: number;
  month: number;
  year: number;
  net_paid: number;
  is_processed: boolean;
}
