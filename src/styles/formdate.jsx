export const formatDate = (dateValue) => {
  if (!dateValue) return "";

  let year, month, day;

  if (typeof dateValue === "string") {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      [, year, month, day] = match;
    } else {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return "";
      year = d.getFullYear();
      month = String(d.getMonth() + 1).padStart(2, "0");
      day = String(d.getDate()).padStart(2, "0");
    }
  } else if (dateValue instanceof Date) {
    year = dateValue.getFullYear();
    month = String(dateValue.getMonth() + 1).padStart(2, "0");
    day = String(dateValue.getDate()).padStart(2, "0");
  } else {
    return String(dateValue); 
  }

  return `${month}/${day}/${year}`;
};