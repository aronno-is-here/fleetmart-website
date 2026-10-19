const customizationKey = (customization) => (
  customization?.name && customization?.number
    ? `${customization.name}${customization.number}`
    : 'std'
)

const samePurchasedLine = (cartItem, purchasedItem) => (
  String(cartItem.id) === String(purchasedItem.product)
  && String(cartItem.size || '') === String(purchasedItem.size || '')
  && customizationKey(cartItem.customization) === customizationKey(purchasedItem.customization)
)

export const removePurchasedItemsFromCart = (cart, purchasedItems = []) => {
  const remaining = cart.map((item) => ({ ...item }))

  for (const purchased of purchasedItems) {
    const purchasedQty = Math.max(1, Number(purchased?.qty) || 1)
    const cartItem = remaining.find((item) => samePurchasedLine(item, purchased))
    if (cartItem) cartItem.qty -= purchasedQty
  }

  return remaining.filter((item) => Number(item.qty) > 0)
}
