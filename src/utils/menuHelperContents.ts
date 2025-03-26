export const menuHelperContents = {
  customerPetList: {
    title: '検索ヘルパー',
    content: '<ul><li>検索対象：オーナー、ペット、電話番号、住所</li><li>診察券番号の検索は「0000-」最後に"-"を追加してエンターキー</li><li>電話番号の検索は「0000t」最後に"t"を追加してエンターキー</li></ul>'
  },
  requestDetail: {
    title: 'RQ Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
  employeeList: {
    title: 'Employee List Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
  empInfoList: {
    title: 'Emp Info List Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
  breedDiseaseList: {
    title: 'Search Breed Disease List Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
  categoryList: {
    title: 'Search Category List Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
  labList: {
    title: '検査項目マスタ',
    content: '<ul><li>検査項目の基準値を動物種・性別・年齢で設定できます。</li></ul>'
  },
  commonList: {
    title: 'Search Common List Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
  cliCommonList: {
    title: 'Search Cli Common List Page',
    content: '<ul><li>Test for content </li><li class="text-negative">Test for content </li></ul>'
  },
}

export const itemServiceHelperContents = {
  itemServiceViewPage: {
    title: '商品・サービスヘルパー',
    content: `
      <ul class="normal-content">
        <li>商品・サービス（略して商品）は親子関係で管理を行います。<br/>例えば、<strong>親商品</strong>に<span class="text-marker">「予防接種ワクチン」</span>、<strong>子商品</strong>に<span class="text-marker">「バンガード®プラス 5/CV」</span>などの商品バリエーションを追加します。<br/>このような階層で子商品を追加すると、商品を整理することができ、商品検索時に便利です。</li>
        <li>
          <span class="text-marker">商品データは4階層</span>で管理されています。<br/>
          <strong>
            第一階層：<span class="text-grey-400 q-mr-sm">ー</span>商品またはサービス<br/>
            第二階層：<span class="text-grey-400 q-mr-sm">ーー</span>区分<br/>
            第三階層：<span class="text-grey-400 q-mr-sm">ーーー</span>大分類<br/>
            第四階層：<span class="text-grey-400 q-mr-sm">ーーーー</span>中分類
          </strong><br/>
          編集することは可能ですが、重要なマスタデータの為、変更操作は慎重に行ってください。
        </li>
        <li>
          商品区分によって、リクエスト上でのオーダーセクション（治療サービス、処方箋、注射・点滴）で商品検索を行うことができます。<br/>
            <strong><span class="text-marker">治療サービス</span></strong>：商品区分が「医薬品」以外の全ての商品<br/>
            <strong><span class="text-marker">処方箋</span></strong>：商品区分が「医薬品」かつ、分類（大分類または中分類）が「注射」を除く商品<br/>
            <strong><span class="text-marker">注射・点滴</span></strong>：商品区分が「医薬品」かつ、分類（大分類または中分類）から「注射」に該当する商品<br/>
        </li>
      </ul>
    `
  },
  itemServiceViewPage2: {
    title: '商品検索の活用',
    content: `
      <ul class="normal-content">
        <li>
          検索時には以下を対象として検索します。<br/>
          ・サービス商品名<br/>
          ・サービス商品名カナ<br/>
          ・診療明細表示名<br/>
          ・医薬品有効成分名<br/>
          ・大・中分類名<br/>
          ・検索語句1-3、子商品名（商品名・包装単位名）
        </li>
        <li>検索語句を工夫して検索しやすくしてください。検索語句が3つ以上必要な場合には、キーワードの後にスペースを入れて次のキーワードを含めてください。各フィールドに100文字まで入力できます。</li>
      </ul>
    `
  },
  itemServiceViewPage3: {
    title: '診療明細の表示名',
    content: `
      <ul class="normal-content">
        <li>会計時の診療明細の名称を定義できます。</li>
        <li>
          <span class="text-marker">デフォルト名は「診療明細表示名」</span>ですが、以下を<a href="/SearchClinicList?tab=会計">病院設定 会計タブ</a>で指定した場合にはオーダー分類により別の会計明細名を指定できます。<br/>
          ・親商品名<br/>
          ・子商品名<br/>
          ・大分類名<br/>
          ・中分類名<br/>
          ・商品区分名
        </li>
      </ul>
    `
  },
  itemServiceViewPage4: {
    title: '品名包装単位',
    content: `
      <ul class="normal-content">
        <li><span class="text-marker">品名包装単位</span>とは、<span class="text-marker">子商品</span>です。</li>
        <li>親商品のみ登録ではオーダーへの追加は出来ません。<br/>必ず品名包装単位も追加します。</li>
        <li class="no-list-style">
          <ul>
            <li>
              例① <strong>親商品</strong>に<span class="text-marker">「予防接種ワクチン」</span>、<strong>子商品</strong>に<span class="text-marker">「バンガード®プラス 5/CV」</span>や<span class="text-marker">「バンガード®プラス CPV」</span>などの商品バリエーションを追加します。
            </li>
            <li>
              例② <strong>親商品</strong>に<span class="text-marker">「入院」</span>、<strong>子商品</strong>に<span class="text-marker">「日帰り入院 ~10kg未満」</span>や<span class="text-marker">「ICU入院 大型」</span>などの商品バリエーションを追加します。
            </li>
          </ul>          
        </li>
        <li>品名包装単位名は検索対象です。</li>
        <li>品名包装単位名で料金を指定します。</li>
        <li>医薬品の品名包装単位名の場合、有効成分量を指定します。</li>
      </ul>
    `
  },
  itemServiceViewPage5: {
    title: 'オプション',
    content: `
      <ul class="normal-content">
        <li>オーダー商品の検索時に本商品のオプションとして<span class="text-marker">同時に表示される商品</span>を登録できます。</li>
        <li>同類のオーダー（治療サービス/処方箋/注射・点滴）の商品しか利用できません。</li>
      </ul>
    `
  },
  itemServiceViewPage6: {
    title: '対象動物',
    content: `
      <ul class="normal-content">
        <li>
          オーダー追加時に<span class="text-marker">対象動物で商品の絞込</span>ができます。<br/>
          例えば、ウサギの診療時には、ウサギ専用の商品のみを検索することができます。
        </li>
      </ul>
    `
  },
  itemServiceViewPage7: {
    title: 'TOP30',
    content: `
      <ul class="normal-content">
        <li>オーダー追加時に利用します。</li>
        <li>クイックに照会したい商品のみ適用します。</li>
        <li>半角数字を1-30で入力してください。<br/>小さな数字を上位表示します。</li>
        <li>30以上で入力しても表示します。</li>
      </ul>
    `
  },
  itemServiceViewPage8: {
    title: '服用量の計算',
    content: `
      <ul class="normal-content">
        <li>医薬品をオーダーとして登録する際、以下の4通りの方法が医薬品単位で設定できます。</li>
        <li>①<span class="text-marker">早見表</span>：体重範囲を指定し、品名包装単位に服用量を指定できます。早見表を設定すると体重に応じて自動計算を行います。</li>
        <li>②<span class="text-marker">perキロ（可変）</span>：体重に応じた適用力価の範囲を指定します。オーダー追加時に体重に応じて自動で服用力価を設定します。</li>
        <li>③<span class="text-marker">perヘッド（可変）</span>：1個体に適用する力価範囲を指定します。オーダー追加時に自動で服用力価を設定します。</li>
        <li>④<span class="text-marker">数量指定</span>：オーダー追加時に手動で数量を指定します。自動計算は適用されません。</li>
        <li>上記、①ー③を医薬品に指定する際、表示ページ（保存後の次のページ）で詳細データを追加・編集できます。</li>
      </ul>
    `
  },
}

export const filterCustomerPetDmHelperContents = {
  customerPetViewPage: {
    title: 'DMリスト',
    content: `
      <ul class="normal-content">
        <li>このページでは<span class="text-marker">「次回来院の予定日」</span>があるペット、<span class="text-marker">「予防系オーダー」</span>を実施したペットを検索し、検索結果よりCSVの抽出が可能です。</li>
        <li>詳細条件を設定すると、詳細の絞り込みができます。</li>
        <li>予防に関わらず、すべてのペット、動物種、年齢、最終来院日等で絞り込みを行う場合には、メニュー 31 「<a href="/SearchCustomerList">オーナー・ペット検索</a>」のCSV出力を利用してください。</li>
      </ul>
    `
  },
}