declare module "lucide-react" {
  import * as React from "react";
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;
  export const Camera: LucideIcon;
  export const ImagePlus: LucideIcon;
  export const X: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Upload: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const Square: LucideIcon;
  export const Loader2: LucideIcon;
  export const Sparkles: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Cpu: LucideIcon;
  export const Info: LucideIcon;
  export const Flame: LucideIcon;
  export const BookOpen: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Target: LucideIcon;
  export const Brain: LucideIcon;
  export const Check: LucideIcon;
  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Copy: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Dumbbell: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Plus: LucideIcon;
  export const FileDown: LucideIcon;
  export const Skull: LucideIcon;
  export const Swords: LucideIcon;
  export const WifiOff: LucideIcon;
  export const Coins: LucideIcon;
  export const Code2: LucideIcon;
  export const FileText: LucideIcon;
  export const Image: LucideIcon;
  export const HeartHandshake: LucideIcon;
  const icon: LucideIcon;
  export default icon;
}
