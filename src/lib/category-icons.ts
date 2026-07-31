import {
  Home,
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  Zap,
  Wifi,
  Dumbbell,
  PawPrint,
  Baby,
  Gift,
  PiggyBank,
  CreditCard,
  Shirt,
  Coffee,
  Fuel,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const RULES: Array<[RegExp, LucideIcon]> = [
  [/rent|hous|mortgage|home|apartment|accommodat/i, Home],
  [/grocer|supermarket|market/i, ShoppingCart],
  [/food|restaurant|dining|meal|eat/i, UtensilsCrossed],
  [/coffee|cafe|tea/i, Coffee],
  [/fuel|petrol|gas station|diesel/i, Fuel],
  [/transport|car|taxi|uber|bus|train|metro|commut/i, Car],
  [/shop|cloth|apparel|fashion/i, Shirt],
  [/entertain|movie|cinema|game|fun|netflix/i, Clapperboard],
  [/health|medic|doctor|pharma|dental|insur/i, HeartPulse],
  [/educat|school|course|tuition|book|study/i, GraduationCap],
  [/travel|trip|flight|holiday|vacation/i, Plane],
  [/electric|utilit|water|power|energy/i, Zap],
  [/internet|wifi|broadband/i, Wifi],
  [/phone|mobile|telecom/i, Smartphone],
  [/gym|fitness|sport|workout/i, Dumbbell],
  [/pet|dog|cat/i, PawPrint],
  [/kid|child|baby|family/i, Baby],
  [/gift|donat|charit/i, Gift],
  [/saving|invest|deposit/i, PiggyBank],
  [/loan|debt|credit|emi|bill/i, CreditCard],
  [/salary|income|wallet|cash|misc/i, Wallet],
];

export function getCategoryIcon(name: string): LucideIcon {
  for (const [re, Icon] of RULES) if (re.test(name)) return Icon;
  return Wallet;
}
