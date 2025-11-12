import React, { forwardRef, memo } from 'react';
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
import { headingStyle } from './styles';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { cssInterop } from 'nativewind';

type IHeadingProps = VariantProps<typeof headingStyle> &
  React.ComponentPropsWithoutRef<typeof H1> & {
    as?: React.ElementType;
  };

cssInterop(H1, { className: 'style' });
cssInterop(H2, { className: 'style' });
cssInterop(H3, { className: 'style' });
cssInterop(H4, { className: 'style' });
cssInterop(H5, { className: 'style' });
cssInterop(H6, { className: 'style' });

const headingComponents: Record<string, typeof H1> = {
  '5xl': H1,
  '4xl': H1,
  '3xl': H1,
  '2xl': H2,
  xl: H3,
  lg: H4,
  md: H5,
  sm: H6,
  xs: H6,
};

const MappedHeading = memo(
  forwardRef<React.ComponentRef<typeof H1>, IHeadingProps>(
    function MappedHeading(
      {
        size,
        className,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        ...props
      },
      ref
    ) {
      const componentKey = size ?? 'lg';
      const HeadingComponent = headingComponents[componentKey] ?? H4;
      const assignRef = React.useCallback(
        (node: React.ComponentRef<typeof H1> | null) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<React.ComponentRef<typeof H1> | null>).current = node;
          }
        },
        [ref]
      );
      return (
        <HeadingComponent
          className={headingStyle({
            size,
            isTruncated,
            bold,
            underline,
            strikeThrough,
            sub,
            italic,
            highlight,
            class: className,
          })}
          {...props}
          ref={assignRef}
        />
      );
    }
  )
);

const Heading = memo(
  forwardRef<React.ComponentRef<typeof H1>, IHeadingProps>(function Heading(
    { className, size = 'lg', as: AsComp, ...props },
    ref
  ) {
    const {
      isTruncated,
      bold,
      underline,
      strikeThrough,
      sub,
      italic,
      highlight,
    } = props;

    if (AsComp) {
      return (
        <AsComp
          className={headingStyle({
            size,
            isTruncated,
            bold,
            underline,
            strikeThrough,
            sub,
            italic,
            highlight,
            class: className,
          })}
          {...props}
        />
      );
    }

    return (
      <MappedHeading className={className} size={size} ref={ref} {...props} />
    );
  })
);

Heading.displayName = 'Heading';

export { Heading };
