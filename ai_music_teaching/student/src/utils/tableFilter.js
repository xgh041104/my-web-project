export default function createFilter(dataList, params, extraKeyDeal = key => key) {
  return dataList?.filter((item) => {
    let result = true;
    if (typeof params !== "object") {
      return true;
    }
    Object.entries(params).forEach(([key, value]) => {
      if (key == "current" || key == "pageSize" || !value) {
        return;
      }
      const dataKey = extraKeyDeal(key);
      if (item.hasOwnProperty(dataKey)) {
        const dataValue = item[dataKey];
        if (typeof dataValue === "string") {
          result = (result && dataValue.indexOf(value) != -1)
        }
        else if (typeof dataValue === "number") {
          result = (result && dataValue == value)

        }

      }
    })
    // console.log(`get ${JSON.stringify(params)} true name :`, item.TrueName, result);
    return result;
  }) || []
}