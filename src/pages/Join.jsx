import { useState } from 'react';
import { PageHead, Reveal } from '../components/Bits.jsx';
import { DEPARTMENTS, RECRUIT } from '../data/content.js';
import { ORG } from '../data/site.js';

const FIELDS = [
  { name: 'name', label: '姓名', auto: 'name' },
  { name: 'sid', label: '学号', inputMode: 'numeric', pattern: /^\d{6,14}$/, hint: '请输入 6–14 位数字学号' },
  { name: 'major', label: '学院 / 专业' },
  { name: 'contact', label: '手机或微信' },
];

// 纯前端演示：校验通过即展示成功状态，不发送任何数据
export default function Join() {
  const [form, setForm] = useState({ dept: '还没想好' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    // 用户开始修正这个字段就摘掉错误态，不用等到下一次提交
    setErrors((err) => (err[k] ? { ...err, [k]: undefined } : err));
  };
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    FIELDS.forEach((f) => {
      const v = (form[f.name] || '').trim();
      if (!v) err[f.name] = `请填写${f.label}`;
      else if (f.pattern && !f.pattern.test(v)) err[f.name] = f.hint;
    });
    setErrors(err);
    if (Object.keys(err).length) {
      e.currentTarget.querySelector(`[name="${Object.keys(err)[0]}"]`)?.focus();
      return;
    }
    setDone(true);
  };

  return (
    <>
      <PageHead lede="不必已经专业，只需要保有好奇——找到与你气味相投的部门。" />
      <section className="section">
        <div className="wrap join">
          <div className="join__depts">
            <p className="eyebrow">了解部门 · Departments</p>
            <ol>
              {DEPARTMENTS.map((d, i) => (
                <Reveal as="li" key={d.name} delay={i * 80} className="jdept glass glow">
                  <span className="mono">0{i + 1}</span>
                  <div>
                    <h2>{d.name}</h2>
                    <p>{d.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <aside className="join__panel glass">
            <p className="eyebrow">招新信息 · 2026</p>
            <h2 className="join__h">欢迎加入<span className="grad">{ORG.name}</span></h2>
            <ul className="join__facts">
              {RECRUIT.map((r) => <li key={r}>{r}</li>)}
            </ul>

            {done ? (
              <div className="join__done" role="status">
                <span className="join__done-orb" aria-hidden="true" />
                <h3>欢迎你，同路人</h3>
                <p>{form.name}，报名信息已记录（演示）。集中招新开始后，我们会通过你留下的联系方式联系你。</p>
                <button type="button" className="tlink" onClick={() => { setDone(false); setForm({ dept: '还没想好' }); }}>再填一份</button>
              </div>
            ) : (
              <form className="jform" onSubmit={submit} noValidate>
                {FIELDS.map((f) => (
                  <label key={f.name} className={`jfield ${errors[f.name] ? 'is-err' : ''}`}>
                    <span>{f.label}</span>
                    <input
                      name={f.name}
                      autoComplete={f.auto || 'off'}
                      inputMode={f.inputMode}
                      value={form[f.name] || ''}
                      onChange={set(f.name)}
                      aria-invalid={!!errors[f.name]}
                      aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
                    />
                    {errors[f.name] && <em id={`${f.name}-err`}>{errors[f.name]}</em>}
                  </label>
                ))}
                <fieldset className="jradios">
                  <legend>意向部门</legend>
                  {[...DEPARTMENTS.map((d) => d.name), '还没想好'].map((d) => (
                    <label key={d} className={form.dept === d ? 'is-on' : ''}>
                      <input type="radio" name="dept" value={d} checked={form.dept === d} onChange={set('dept')} />
                      {d}
                    </label>
                  ))}
                </fieldset>
                <label className="jfield">
                  <span>想对我们说（选填）</span>
                  <textarea name="msg" rows={3} value={form.msg || ''} onChange={set('msg')} />
                </label>
                <button type="submit" className="btn btn--pri jform__submit">在线报名 <span aria-hidden="true">→</span></button>
              </form>
            )}

            <p className="join__mail">
              非集中招新期间，可通过邮件了解加入方式：
              <a className="tlink" style={{ color: 'var(--cyan)' }} href={`mailto:${ORG.mailOffice}`}>{ORG.mailOffice}</a>
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
