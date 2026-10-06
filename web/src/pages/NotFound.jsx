import { Link } from 'react-router-dom';

export default function NotFound({ title = '你漂流到了星图之外', text = '页面可能已被移动、尚未发布，或者链接有误。', back = '/', backText = '回到首页' }) {
  return (
    <section className="nf">
      <p className="nf__code grad" aria-hidden="true">404</p>
      <h1 className="nf__title">{title}</h1>
      <p className="nf__text">{text}</p>
      <Link to={back} className="btn btn--pri">{backText} <span className="arr">→</span></Link>
    </section>
  );
}
