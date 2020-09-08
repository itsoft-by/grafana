import { InterpolateFunction } from '@grafana/data';

export function getThresholdValue(replaceVariables: InterpolateFunction, value: string): number {
  if (value && value.startsWith('$')) {
    let result = replaceVariables(value);

    return result === value ? NaN : Number.parseFloat(result);
  } else {
    return Number.parseFloat(value);
  }
}
