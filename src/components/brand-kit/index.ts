/**
 * Brand Kit Components
 *
 * Components for managing brand assets including logos, colors, and fonts.
 * @validates Requirements 18, 19, 20, 21
 */

export {
  LogoUpload,
  type LogoUploadProps,
  ALLOWED_LOGO_FORMATS,
  ALLOWED_LOGO_EXTENSIONS,
  MAX_LOGO_SIZE,
  validateLogoFormat,
  isValidLogoExtension,
} from "./logo-upload";

export {
  ColorPaletteBuilder,
  type ColorPaletteBuilderProps,
  DEFAULT_MAX_COLORS,
  DEFAULT_NEW_COLOR,
} from "./color-palette-builder";

export {
  BrandFontSelector,
  type FontSelectorProps,
  SUPPORTED_FONTS,
  type SupportedFont,
} from "./brand-font-selector";

export {
  LogoPositionControls,
  type LogoPositionControlsProps,
  type LogoPosition,
  type LogoSettings,
  DEFAULT_LOGO_SIZE,
  MIN_LOGO_SIZE,
  MAX_LOGO_SIZE as MAX_LOGO_SIZE_PERCENT,
  DEFAULT_LOGO_OPACITY,
  MIN_LOGO_OPACITY,
  MAX_LOGO_OPACITY,
  DEFAULT_LOGO_POSITION,
} from "./logo-position-controls";

export {
  BrandKitManager,
  type BrandKitManagerProps,
  type BrandKitPreviewProps,
} from "./brand-kit-manager";
