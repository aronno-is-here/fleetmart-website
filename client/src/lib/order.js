export const shouldClearPurchasedCart = (order) => (
  Boolean(order)
  && ['paid', 'partial'].includes(order.paymentStatus)
  && order.orderStatus !== 'cancelled'
)
