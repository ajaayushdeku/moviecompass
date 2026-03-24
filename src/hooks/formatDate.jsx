import React from "react";

const formatDate = (contentDate, monthShort) => {
  return () => {
    const date = new Date(contentDate);
    const year = date.getFullYear();
    const month = date.toLocaleString("en-US", {
      month: "long",
    });
    const day = date.getDate();
    return ` ${monthShort ? month.slice(0, 3) : month} ${day}${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}, ${year}`;
  };
};

export default formatDate;
