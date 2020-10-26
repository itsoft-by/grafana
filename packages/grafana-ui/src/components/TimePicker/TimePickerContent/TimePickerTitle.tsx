import React, { memo, PropsWithChildren } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { useTheme, stylesFactory } from '../../../themes';

const getStyle = stylesFactory((theme: GrafanaTheme) => {
  return {
    text: css`
      font-size: ${theme.typography.size.md};
      font-weight: ${theme.typography.weight.semibold};
      color: ${theme.colors.formLabel};
      background-color: #202226;
      width: 100%;
      padding: 0.5rem;
    `,
  };
});

export const TimePickerTitle = memo<PropsWithChildren<{}>>(({ children }) => {
  const theme = useTheme();
  const styles = getStyle(theme);

  return <div className={styles.text}>{children}</div>;
});
