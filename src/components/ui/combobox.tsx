import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, XIcon } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const Combobox = ComboboxPrimitive.Root;

function ComboboxInput(
  props: ComboboxPrimitive.Input.Props & {
    ref?: RefObject<HTMLInputElement | null>;
  }
) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      render={<Input />}
      {...props}
    />
  );
}

function ComboboxTrigger(props: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      render={<Button variant="outline" />}
      {...props}
    />
  );
}

function ComboboxIcon(props: ComboboxPrimitive.Icon.Props) {
  return <ComboboxPrimitive.Icon data-slot="combobox-icon" {...props} />;
}

function ComboboxClear({
  children,
  className,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      aria-label="Clear selection"
      className={cn(
        "flex h-9 w-6 items-center justify-center rounded bg-transparent p-0",
        className
      )}
      data-slot="combobox-clear"
      {...props}
    >
      {children ?? <XIcon className="size-4" />}
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxValue(props: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxChips({
  className,
  ...props
}: ComboboxPrimitive.Chips.Props & { ref?: RefObject<HTMLDivElement | null> }) {
  return (
    <ComboboxPrimitive.Chips
      className={cn(
        "flex min-h-9 flex-wrap items-start gap-1 rounded-md border px-1.5 py-1.5 transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className
      )}
      data-slot="combobox-chips"
      {...props}
    />
  );
}

function ComboboxChip({ className, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      className={cn(
        "flex cursor-default items-center gap-1 rounded-md bg-muted px-1 ps-2 pe-0 text-xs outline-none",
        className
      )}
      data-slot="combobox-chip"
      {...props}
    />
  );
}

function ComboboxChipRemove({
  className,
  children,
  ...props
}: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      aria-label="Remove"
      className={cn(
        "rounded-md p-1 text-inherit hover:bg-accent-foreground/10",
        className
      )}
      data-slot="combobox-chip-remove"
      {...props}
    >
      {children ?? <XIcon className="size-3.5" />}
    </ComboboxPrimitive.ChipRemove>
  );
}

function ComboboxPopup({ className, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Popup
      className={cn(
        "max-h-[min(var(--available-height),23rem)] w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) scroll-pt-2 scroll-pb-2 overflow-y-auto overscroll-contain rounded-md bg-popover py-2 shadow-md outline-1 outline-border transition-[transform,scale,opacity] data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[ending-style]:transition-none data-[side=none]:data-[starting-style]:transition-none data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:shadow-none",
        className
      )}
      data-slot="combobox-popup"
      {...props}
    />
  );
}

function ComboboxPositioner({
  className,
  ...props
}: ComboboxPrimitive.Positioner.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        className={cn("z-50 outline-none", className)}
        data-slot="combobox-positioner"
        {...props}
      />
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxArrow(props: ComboboxPrimitive.Arrow.Props) {
  return <ComboboxPrimitive.Arrow data-slot="combobox-arrow" {...props} />;
}

function ComboboxStatus({
  className,
  ...props
}: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status
      className={cn(
        "px-4.5 py-2 text-muted-foreground text-sm empty:m-0 empty:p-0",
        className
      )}
      data-slot="combobox-status"
      {...props}
    />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        "flex items-center justify-center not-empty:py-1 text-muted-foreground text-sm",
        className
      )}
      data-slot="combobox-empty"
      {...props}
    />
  );
}

function ComboboxList(props: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" {...props} />;
}

function ComboboxRow(props: ComboboxPrimitive.Row.Props) {
  return <ComboboxPrimitive.Row data-slot="combobox-row" {...props} />;
}

function ComboboxItem({ className, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      className={cn(
        "flex grid cursor-default select-none items-center gap-4 py-2 pr-8 pl-4 text-sm leading-4 outline-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-accent-foreground data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:-z-1 data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-accent",
        className
      )}
      data-slot="combobox-item"
      {...props}
    />
  );
}

function ComboboxItemIndicator({
  className,
  children,
  ...props
}: ComboboxPrimitive.ItemIndicator.Props) {
  return (
    <ComboboxPrimitive.ItemIndicator
      className={cn("col-start-1", className)}
      data-slot="combobox-item-indicator"
      {...props}
    >
      {children ?? <CheckIcon className="size-4" />}
    </ComboboxPrimitive.ItemIndicator>
  );
}

function ComboboxSeparator(props: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      render={<Separator />}
      {...props}
    />
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      className={cn("mb-3 last:mb-0", className)}
      data-slot="combobox-group"
      {...props}
    />
  );
}

function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      className={cn(
        "px-4 py-2 font-medium text-muted-foreground text-sm",
        className
      )}
      data-slot="combobox-group-label"
      {...props}
    />
  );
}

function ComboboxCollection(props: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

export {
  Combobox,
  ComboboxArrow,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxRow,
  ComboboxSeparator,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
};
