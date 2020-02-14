import {
  VNode, h, Fragment,
  BaseComponent, ElementDragging, elementClosest, PointerDragEvent, RefMap, findElements,
} from '@fullcalendar/core'


export interface SpreadsheetHeaderProps {
  superHeaderText: string
  colSpecs: any
  onColWidthChange?: (colWidths: number[]) => void
}

const SPREADSHEET_COL_MIN_WIDTH = 20


export default class SpreadsheetHeader extends BaseComponent<SpreadsheetHeaderProps> {

  private resizerElRefs = new RefMap<HTMLElement>(this._handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}


  render(props: SpreadsheetHeaderProps) {
    let { colSpecs, superHeaderText } = props
    let rowNodes: VNode[] = []

    if (superHeaderText) {
      rowNodes.push(
        <tr class='fc-super'>
          <th colSpan={colSpecs.length}>
            <div class='fc-cell-content'>
              <span class='fc-cell-text'>
                {superHeaderText}
              </span>
            </div>
          </th>
        </tr>
      )
    }

    rowNodes.push(
      <tr>
        {colSpecs.map((o, i) => {
          let isLastCol = i === (colSpecs.length - 1)

          // need empty inner div for abs positioning for resizer
          return (
            <th>
              <div>
                <div class='fc-cell-content'>
                  {o.isMain &&
                    <span class='fc-expander-space'>
                      <span class='fc-icon'></span>
                    </span>
                  }
                  <span class='fc-cell-text'>
                    {o.labelText || '' /* what about normalizing this value ahead of time? */ }
                  </span>
                </div>
                {!isLastCol &&
                  <div class='fc-col-resizer' ref={this.resizerElRefs.createRef(i)}></div>
                }
              </div>
            </th>
          )
        })}
      </tr>
    )

    return (<Fragment>{rowNodes}</Fragment>)
  }


  _handleColResizerEl(resizerEl: HTMLElement | null, index: string) {
    let { colDraggings } = this

    if (!resizerEl) {
      let dragging = colDraggings[index]

      if (dragging) {
        dragging.destroy()
        delete colDraggings[index]
      }

    } else {
      let dragging = this.initColResizing(resizerEl, parseInt(index, 10))

      if (dragging) {
        colDraggings[index] = dragging
      }
    }
  }


  initColResizing(resizerEl: HTMLElement, index: number) {
    let { pluginHooks, isRtl } = this.context
    let { onColWidthChange } = this.props
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = new ElementDraggingImpl(resizerEl)
      let startWidth: number // of just the single column
      let currentWidths: number[] // of all columns

      dragging.emitter.on('dragstart', () => {
        let allCells = findElements(elementClosest(resizerEl, 'tr'), 'th')

        currentWidths = allCells.map((resizerEl) => (
          elementClosest(resizerEl, 'th').getBoundingClientRect().width
        ))
        startWidth = currentWidths[index]
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        currentWidths[index] = Math.max(startWidth + pev.deltaX * (isRtl ? -1 : 1), SPREADSHEET_COL_MIN_WIDTH)

        if (onColWidthChange) {
          onColWidthChange(currentWidths.slice()) // send a copy since currentWidths continues to be mutated
        }
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

      return dragging
    }
  }

}