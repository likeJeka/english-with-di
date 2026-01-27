document.getElementById('copyLink').onclick = () => {
  const link = `${location.origin}/student.html?id=${studentId}`;
  navigator.clipboard.writeText(link);
  alert('Link copied');
};
