import { XAxis, YAxis, type XAxisProps, type YAxisProps } from 'recharts'

export const CHART_MARGIN = { top: 8, right: 16, left: 4, bottom: 28 }

const axisLabelStyle = { fill: '#94a3b8', fontSize: 11 }

export function MonthsXAxis(props: Omit<XAxisProps, 'dataKey'> & { dataKey?: string }) {
  const { dataKey = 'month', ...rest } = props
  return (
    <XAxis
      dataKey={dataKey}
      tick={{ fontSize: 11 }}
      stroke="#64748b"
      label={{
        value: 'Months from now',
        position: 'insideBottom',
        offset: -12,
        style: axisLabelStyle,
      }}
      {...rest}
    />
  )
}

export function DateXAxis(props: Omit<XAxisProps, 'dataKey'> & { dataKey?: string }) {
  const { dataKey = 'date', ...rest } = props
  return (
    <XAxis
      dataKey={dataKey}
      tick={{ fontSize: 11 }}
      stroke="#64748b"
      label={{
        value: 'Snapshot date',
        position: 'insideBottom',
        offset: -12,
        style: axisLabelStyle,
      }}
      {...rest}
    />
  )
}

export function LtvYAxis(props: YAxisProps = {}) {
  return (
    <YAxis
      tick={{ fontSize: 11 }}
      stroke="#64748b"
      label={{
        value: 'LTV (%)',
        angle: -90,
        position: 'insideLeft',
        offset: 12,
        style: axisLabelStyle,
      }}
      {...props}
    />
  )
}

export function UsdYAxis(props: YAxisProps = {}) {
  return (
    <YAxis
      tick={{ fontSize: 11 }}
      stroke="#64748b"
      label={{
        value: 'USD value',
        angle: -90,
        position: 'insideLeft',
        offset: 12,
        style: axisLabelStyle,
      }}
      {...props}
    />
  )
}

export function BtcPriceYAxis(props: YAxisProps = {}) {
  return (
    <YAxis
      tick={{ fontSize: 11 }}
      stroke="#64748b"
      label={{
        value: 'BTC price (USD)',
        angle: -90,
        position: 'insideLeft',
        offset: 12,
        style: axisLabelStyle,
      }}
      {...props}
    />
  )
}

export function LtvAndHfYAxis(props: YAxisProps = {}) {
  return (
    <YAxis
      tick={{ fontSize: 11 }}
      stroke="#64748b"
      label={{
        value: 'LTV (%) / Health Factor',
        angle: -90,
        position: 'insideLeft',
        offset: 12,
        style: axisLabelStyle,
      }}
      {...props}
    />
  )
}